from flask import Flask, request, jsonify, g, send_from_directory
from flask_cors import CORS
import requests
from dotenv import load_dotenv

load_dotenv()
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import anthropic
import json
import re
import os
import base64
from concurrent.futures import ThreadPoolExecutor, as_completed

from db import init_db, upsert_user, get_user_by_id, save_analysis, get_user_analyses, get_analysis_by_id, delete_analysis
from auth import verify_google_token, create_jwt, require_auth

# ---------- Production static-file serving ----------
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
HAS_STATIC = os.path.isdir(STATIC_DIR)

app = Flask(__name__, static_folder=None)
app.secret_key = os.environ.get("JWT_SECRET", "change-me-in-production")

# Dynamic CORS: allow localhost in dev, plus any FRONTEND_URL in prod
cors_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
if os.environ.get("FRONTEND_URL"):
    cors_origins.append(os.environ["FRONTEND_URL"])
CORS(app, supports_credentials=True, origins=cors_origins)

# Initialize database on startup
init_db()

client = anthropic.Anthropic()


def fetch_url(url, timeout=10):
    try:
        response = requests.get(
            url,
            timeout=timeout,
            headers={"User-Agent": "GeoAgent-SEO-Auditor/1.0"},
            allow_redirects=True,
        )
        return response
    except Exception:
        return None


# ──────────────────────────────────────────────────────────────────────────────
# Auth endpoints
# ──────────────────────────────────────────────────────────────────────────────

@app.route("/api/auth/google", methods=["POST"])
def google_login():
    """Exchange a Google OAuth credential for a Geode JWT."""
    data = request.get_json()
    credential = data.get("credential")
    if not credential:
        return jsonify({"error": "Google credential is required"}), 400

    try:
        google_user = verify_google_token(credential)
    except Exception as e:
        return jsonify({"error": f"Invalid Google token: {e}"}), 401

    user = upsert_user(
        google_id=google_user["sub"],
        email=google_user["email"],
        name=google_user["name"],
        picture_url=google_user["picture"],
    )

    token = create_jwt(user["id"], user["email"])

    return jsonify({
        "success": True,
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "picture": user["picture_url"],
        },
    })


@app.route("/api/auth/me", methods=["GET"])
@require_auth
def auth_me():
    """Return the current user's profile."""
    user = get_user_by_id(g.user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "picture": user["picture_url"],
        }
    })


# ──────────────────────────────────────────────────────────────────────────────
# History endpoints
# ──────────────────────────────────────────────────────────────────────────────

@app.route("/api/history", methods=["GET"])
@require_auth
def list_history():
    """Return the authenticated user's past analyses."""
    limit = request.args.get("limit", 50, type=int)
    offset = request.args.get("offset", 0, type=int)
    analyses = get_user_analyses(g.user_id, limit=limit, offset=offset)
    return jsonify({"analyses": analyses})


@app.route("/api/history/<analysis_id>", methods=["GET"])
@require_auth
def get_history_item(analysis_id):
    """Return full results for a specific past analysis."""
    analysis = get_analysis_by_id(analysis_id, g.user_id)
    if not analysis:
        return jsonify({"error": "Analysis not found"}), 404
    return jsonify({"analysis": analysis})


@app.route("/api/history/<analysis_id>", methods=["DELETE"])
@require_auth
def delete_history_item(analysis_id):
    """Delete a specific past analysis."""
    deleted = delete_analysis(analysis_id, g.user_id)
    if not deleted:
        return jsonify({"error": "Analysis not found"}), 404
    return jsonify({"success": True})


@app.route("/api/my-dashboard", methods=["GET"])
@require_auth
def my_dashboard():
    """Return dashboard metrics for the authenticated user's analyses."""
    from db import get_db
    conn = get_db()
    try:
        user_id = g.user_id

        # Total counts
        total = conn.execute(
            "SELECT COUNT(*) FROM analyses WHERE user_id = ?", (user_id,)
        ).fetchone()[0]

        url_count = conn.execute(
            "SELECT COUNT(*) FROM analyses WHERE user_id = ? AND mode = 'url'", (user_id,)
        ).fetchone()[0]

        github_count = conn.execute(
            "SELECT COUNT(*) FROM analyses WHERE user_id = ? AND mode = 'github'", (user_id,)
        ).fetchone()[0]

        # Average SEO score
        avg_row = conn.execute(
            "SELECT AVG(score) as avg FROM analyses WHERE user_id = ? AND score IS NOT NULL",
            (user_id,),
        ).fetchone()
        avg_seo = round(avg_row["avg"], 1) if avg_row["avg"] else None

        # Get all URL analyses with full results to extract AI visibility + scores over time
        rows = conn.execute(
            "SELECT input, score, results, created_at FROM analyses "
            "WHERE user_id = ? ORDER BY created_at ASC",
            (user_id,),
        ).fetchall()

        # Build per-site time series and extract AI visibility scores
        sites = {}  # domain -> [{date, seo_score, ai_score}]
        timeline = []  # [{date, seo_score, ai_score, site}]
        ai_scores_all = []

        for row in rows:
            try:
                results = json.loads(row["results"])
            except Exception:
                continue

            inp = row["input"]
            created = row["created_at"]
            seo_score = row["score"]

            # Extract AI visibility score from results blob
            ai_score = None
            ai_vis = results.get("aiVisibility")
            if ai_vis and isinstance(ai_vis, dict):
                ai_score = ai_vis.get("score") or ai_vis.get("overall_score") or ai_vis.get("overallScore")
                if ai_score is not None:
                    try:
                        ai_score = float(ai_score)
                    except (ValueError, TypeError):
                        ai_score = None
                if ai_score is not None:
                    ai_scores_all.append(ai_score)

            # Determine domain/site key
            try:
                from urllib.parse import urlparse as _urlparse
                parsed = _urlparse(inp)
                domain = parsed.netloc or inp
            except Exception:
                domain = inp

            entry = {
                "date": created[:10] if created else None,
                "datetime": created,
                "seo_score": seo_score,
                "ai_score": ai_score,
                "site": domain,
                "input": inp,
            }
            timeline.append(entry)

            if domain not in sites:
                sites[domain] = []
            sites[domain].append(entry)

        # Average AI score
        avg_ai = round(sum(ai_scores_all) / len(ai_scores_all), 1) if ai_scores_all else None

        # Best and worst SEO scores
        seo_scores = [e["seo_score"] for e in timeline if e["seo_score"] is not None]
        best_seo = max(seo_scores) if seo_scores else None
        worst_seo = min(seo_scores) if seo_scores else None

        # Per-site summaries (latest score, best score, trend)
        site_summaries = []
        for domain, entries in sites.items():
            scored = [e for e in entries if e["seo_score"] is not None]
            ai_scored = [e for e in entries if e["ai_score"] is not None]
            latest_seo = scored[-1]["seo_score"] if scored else None
            latest_ai = ai_scored[-1]["ai_score"] if ai_scored else None
            best_site_seo = max(e["seo_score"] for e in scored) if scored else None
            best_site_ai = max(e["ai_score"] for e in ai_scored) if ai_scored else None
            first_seo = scored[0]["seo_score"] if scored else None
            seo_delta = (latest_seo - first_seo) if (latest_seo is not None and first_seo is not None and len(scored) > 1) else None
            first_ai = ai_scored[0]["ai_score"] if ai_scored else None
            ai_delta = (latest_ai - first_ai) if (latest_ai is not None and first_ai is not None and len(ai_scored) > 1) else None
            site_summaries.append({
                "domain": domain,
                "analysis_count": len(entries),
                "latest_seo": latest_seo,
                "latest_ai": latest_ai,
                "best_seo": best_site_seo,
                "best_ai": best_site_ai,
                "seo_delta": seo_delta,
                "ai_delta": ai_delta,
                "last_analyzed": entries[-1]["datetime"],
            })

        site_summaries.sort(key=lambda s: s["analysis_count"], reverse=True)

        return jsonify({
            "total_analyses": total,
            "url_count": url_count,
            "github_count": github_count,
            "avg_seo": avg_seo,
            "avg_ai": avg_ai,
            "best_seo": best_seo,
            "worst_seo": worst_seo,
            "timeline": timeline,
            "sites": site_summaries,
        })
    finally:
        conn.close()


# ──────────────────────────────────────────────────────────────────────────────
# Analysis endpoints
# ──────────────────────────────────────────────────────────────────────────────

@app.route("/api/analyze", methods=["POST"])
@require_auth
def analyze():
    data = request.get_json()
    url = data.get("url")

    if not url:
        return jsonify({"error": "URL is required"}), 400

    try:
        parsed = urlparse(url)
        origin = f"{parsed.scheme}://{parsed.netloc}"

        # 1. Fetch the main page
        page_response = fetch_url(url)
        page_html = page_response.text if page_response else None
        http_status = page_response.status_code if page_response else None
        final_url = page_response.url if page_response else url

        title = None
        meta_description = None
        canonical = None
        internal_links = []
        external_links = []
        h1_tags = []
        h2_tags = []
        h3_tags = []
        has_schema = False
        og_tags = {}
        soup = None

        if page_html:
            soup = BeautifulSoup(page_html, "html.parser")

            title = soup.title.string.strip() if soup.title else None

            meta_desc = soup.find("meta", attrs={"name": "description"})
            meta_description = meta_desc.get("content") if meta_desc else None

            canonical_tag = soup.find("link", attrs={"rel": "canonical"})
            canonical = canonical_tag.get("href") if canonical_tag else None

            # Extract and deduplicate links
            seen_internal = set()
            seen_external = set()
            for a in soup.find_all("a", href=True):
                href = a["href"]
                try:
                    abs_url = urljoin(url, href)
                    parsed_href = urlparse(abs_url)
                    if parsed_href.netloc == parsed.netloc:
                        if abs_url not in seen_internal:
                            seen_internal.add(abs_url)
                            internal_links.append(abs_url)
                    elif parsed_href.scheme.startswith("http"):
                        if abs_url not in seen_external:
                            seen_external.add(abs_url)
                            external_links.append(abs_url)
                except Exception:
                    pass

            h1_tags = [h.get_text(strip=True) for h in soup.find_all("h1")][:5]
            h2_tags = [h.get_text(strip=True) for h in soup.find_all("h2")][:10]
            h3_tags = [h.get_text(strip=True) for h in soup.find_all("h3")][:10]

            has_schema = bool(soup.find("script", type="application/ld+json"))

            og_title = soup.find("meta", property="og:title")
            og_desc = soup.find("meta", property="og:description")
            og_tags = {
                "title": og_title.get("content") if og_title else None,
                "description": og_desc.get("content") if og_desc else None,
            }

        # 2. Fetch robots.txt
        robots_response = fetch_url(f"{origin}/robots.txt")
        robots_txt = (
            robots_response.text
            if robots_response and robots_response.status_code == 200
            else None
        )

        # Parse sitemap URL from robots.txt
        sitemap_url = None
        if robots_txt:
            match = re.search(r"Sitemap:\s*(.+)", robots_txt, re.IGNORECASE)
            if match:
                sitemap_url = match.group(1).strip()

        if not sitemap_url:
            sitemap_url = f"{origin}/sitemap.xml"

        # 3. Fetch sitemap
        sitemap_response = fetch_url(sitemap_url)
        sitemap_content = (
            sitemap_response.text
            if sitemap_response and sitemap_response.status_code == 200
            else None
        )

        sitemap_page_count = None
        if sitemap_content:
            url_tags = re.findall(r"<url>", sitemap_content)
            sitemap_page_count = len(url_tags) if url_tags else None

        # 4. Build audit data object
        audit_data = {
            "url": url,
            "finalUrl": final_url if final_url != url else None,
            "httpStatus": http_status,
            "title": title,
            "metaDescription": meta_description,
            "canonical": canonical,
            "internalLinkCount": len(internal_links),
            "externalLinkCount": len(external_links),
            "sampleInternalLinks": internal_links[:10],
            "h1Tags": h1_tags,
            "h2Tags": h2_tags,
            "h3Tags": h3_tags,
            "hasSchemaMarkup": has_schema,
            "ogTags": og_tags,
            "robotsTxt": robots_txt[:2000] if robots_txt else None,
            "sitemapUrl": sitemap_url,
            "sitemapFound": bool(sitemap_content),
            "sitemapPageCount": sitemap_page_count,
        }

        # 5. Send to Claude with SEO auditor prompt
        prompt = f"""You are an expert SEO technical auditor.

Only use the data provided below.
If something is not present, say "Not enough data to determine."

Here is the crawled data for: {url}

{json.dumps(audit_data, indent=2)}

Analyze this data and return a valid JSON object with this exact structure:
{{
  "score": <number 0-100>,
  "summary": "<2 sentences max. Overall SEO health verdict.>",
  "visibleIssues": [
    {{ "issue": "<one concise sentence>", "severity": "high|medium|low" }}
  ],
  "linkAnalysis": "<2 sentences max.>",
  "robotsImplications": "<2 sentences max.>",
  "crawlEfficiency": "<2 sentences max.>",
  "dataGaps": ["<short phrase, not a sentence>"],
  "suggestions": [
    {{ "type": "<structure|content|technical|semantic>", "priority": "high|medium|low", "title": "<5 words max>", "description": "<1 sentence, actionable>" }}
  ]
}}

Be specific and reference actual values from the data. Keep every text field brief and direct.

IMPORTANT: Return ONLY the raw JSON object. Do not wrap it in markdown code fences. Do not include any text before or after the JSON."""

        message = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = message.content[0].text

        # Strip markdown code fences if Claude wrapped the JSON anyway
        clean = re.sub(r"^```(?:json)?\s*", "", response_text.strip())
        clean = re.sub(r"\s*```$", "", clean.strip())

        # Extract the outermost JSON object
        json_match = re.search(r"\{[\s\S]*\}", clean)
        if not json_match:
            print("Claude raw response:", response_text)
            return jsonify({"error": "Failed to parse Claude analysis"}), 500

        try:
            analysis = json.loads(json_match.group(0))
        except json.JSONDecodeError as e:
            print("JSON decode error:", e)
            print("Attempted to parse:", json_match.group(0)[:500])
            return jsonify({"error": f"JSON decode error: {e}"}), 500

        # 6. AI Visibility Analysis
        domain = parsed.netloc
        try:
            ai_visibility = compute_ai_visibility(
                audit_data, robots_txt, page_html, soup, domain, url
            )
        except Exception as viz_err:
            print(f"AI visibility analysis error: {viz_err}")
            ai_visibility = None

        result_payload = {
            "success": True,
            "auditData": audit_data,
            "analysis": analysis,
            "aiVisibility": ai_visibility,
        }

        # Save to history
        try:
            score = analysis.get("score") if analysis else None
            save_analysis(g.user_id, "url", url, result_payload, score=score)
        except Exception as save_err:
            print(f"Failed to save analysis: {save_err}")

        return jsonify(result_payload)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ──────────────────────────────────────────────────────────────────────────────
# AI Visibility Analysis helpers
# ──────────────────────────────────────────────────────────────────────────────

AI_BOTS = {
    "GPTBot": {"name": "ChatGPT", "description": "OpenAI ChatGPT crawler"},
    "ChatGPT-User": {"name": "ChatGPT Browse", "description": "ChatGPT browsing feature"},
    "ClaudeBot": {"name": "Claude", "description": "Anthropic Claude crawler"},
    "Google-Extended": {"name": "Gemini", "description": "Google AI training crawler"},
    "PerplexityBot": {"name": "Perplexity", "description": "Perplexity search crawler"},
    "CCBot": {"name": "Common Crawl", "description": "Used by many AI datasets"},
    "Bytespider": {"name": "ByteDance AI", "description": "ByteDance AI crawler"},
    "Amazonbot": {"name": "Amazon Alexa", "description": "Amazon AI assistant crawler"},
}


def check_ai_bot_access(robots_txt):
    """Check which AI bots are allowed/blocked in robots.txt."""
    results = {}
    if not robots_txt:
        for bot_ua, info in AI_BOTS.items():
            results[bot_ua] = {**info, "status": "allowed"}
        return results

    for bot_ua, info in AI_BOTS.items():
        bot_blocked = None
        wildcard_blocked = None
        current_agent = None

        for line in robots_txt.split("\n"):
            stripped = line.strip()
            if not stripped or stripped.startswith("#"):
                continue
            lower = stripped.lower()
            if lower.startswith("user-agent:"):
                current_agent = stripped.split(":", 1)[1].strip()
            elif lower.startswith("disallow:"):
                path = stripped.split(":", 1)[1].strip()
                if current_agent and current_agent.lower() == bot_ua.lower():
                    if path == "/":
                        bot_blocked = True
                    elif path == "":
                        bot_blocked = False
                elif current_agent == "*":
                    if path == "/":
                        wildcard_blocked = True
                    elif path == "":
                        wildcard_blocked = False
            elif lower.startswith("allow:"):
                path = stripped.split(":", 1)[1].strip()
                if current_agent and current_agent.lower() == bot_ua.lower():
                    if path == "/":
                        bot_blocked = False
                elif current_agent == "*":
                    if path == "/":
                        wildcard_blocked = False

        if bot_blocked is not None:
            is_blocked = bot_blocked
        elif wildcard_blocked is not None:
            is_blocked = wildcard_blocked
        else:
            is_blocked = False

        results[bot_ua] = {**info, "status": "blocked" if is_blocked else "allowed"}

    return results


def check_js_rendering(page_html, soup):
    """Check if page content is accessible without JavaScript."""
    if not page_html or not soup:
        return {
            "isJsHeavy": None,
            "textContentLength": 0,
            "scriptCount": 0,
            "hasSPARoot": False,
        }

    text = soup.get_text(strip=True)
    text_length = len(text)
    scripts = soup.find_all("script")
    script_count = len(scripts)

    root_div = (
        soup.find("div", id="root")
        or soup.find("div", id="app")
        or soup.find("div", id="__next")
    )
    has_spa_root = root_div is not None
    spa_root_empty = has_spa_root and len(root_div.get_text(strip=True)) < 50

    noscript = soup.find("noscript")
    has_noscript_msg = noscript is not None and "javascript" in (
        noscript.get_text().lower() if noscript else ""
    )

    is_js_heavy = (
        (text_length < 200 and script_count > 3)
        or spa_root_empty
        or has_noscript_msg
    )

    return {
        "isJsHeavy": is_js_heavy,
        "textContentLength": text_length,
        "scriptCount": script_count,
        "hasSPARoot": has_spa_root,
    }


def analyze_ai_response(response_text, domain):
    """Score an AI model's response to determine if it knows about a domain."""
    if not response_text:
        return {"known": False, "confidence": "none", "snippet": ""}

    text_lower = response_text.lower()
    domain_clean = domain.lower().replace("www.", "")

    negative_phrases = [
        "i don't have",
        "i'm not familiar",
        "i don't know",
        "i'm not sure",
        "no specific information",
        "not aware of",
        "don't have information",
        "i'm not able to find",
        "i cannot find",
        "i lack information",
    ]
    has_negative = any(p in text_lower for p in negative_phrases)
    has_domain = domain_clean in text_lower

    sentences = [s.strip() for s in response_text.split(".") if len(s.strip()) > 20]
    hedges = ["might", "could be", "possibly", "i think", "may be", "not sure"]
    factual_count = len(
        [s for s in sentences if not any(h in s.lower() for h in hedges)]
    )

    if has_negative and not has_domain:
        confidence = "none"
        known = False
    elif has_negative and has_domain:
        confidence = "low"
        known = True
    elif has_domain and factual_count >= 3:
        confidence = "high"
        known = True
    elif has_domain or factual_count >= 2:
        confidence = "medium"
        known = True
    else:
        confidence = "low"
        known = factual_count >= 1

    return {"known": known, "confidence": confidence, "snippet": response_text[:200]}


def query_claude_visibility(domain, url):
    """Ask Claude what it knows about this domain."""
    try:
        prompt = (
            f"What do you know about the website {domain} ({url})? "
            f"What does this website or company do? Be specific and factual. "
            f"If you don't have specific knowledge about this domain, say so honestly."
        )
        message = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}],
        )
        text = message.content[0].text
        result = analyze_ai_response(text, domain)
        result["checked"] = True
        result["model"] = "Claude"
        result["rawResponse"] = text[:400]
        return result
    except Exception as e:
        return {
            "checked": True,
            "known": False,
            "confidence": "none",
            "snippet": f"Error: {e}",
            "model": "Claude",
        }


def query_openai_visibility(domain, url, api_key):
    """Ask ChatGPT what it knows about this domain."""
    try:
        resp = requests.post(
            "https://api.openai.com/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "gpt-4o-mini",
                "messages": [
                    {
                        "role": "user",
                        "content": (
                            f"What do you know about the website {domain} ({url})? "
                            f"What does it do? Be concise and factual. "
                            f"If you don't know, say so."
                        ),
                    }
                ],
                "max_tokens": 500,
            },
            timeout=20,
        )
        if resp.status_code == 200:
            data = resp.json()
            text = data["choices"][0]["message"]["content"]
            result = analyze_ai_response(text, domain)
            result["checked"] = True
            result["model"] = "ChatGPT"
            result["rawResponse"] = text[:400]
            return result
        return {
            "checked": True,
            "known": False,
            "confidence": "none",
            "snippet": f"API error {resp.status_code}",
            "model": "ChatGPT",
        }
    except Exception as e:
        return {
            "checked": True,
            "known": False,
            "confidence": "none",
            "snippet": f"Error: {e}",
            "model": "ChatGPT",
        }


def query_perplexity_visibility(domain, url, api_key):
    """Ask Perplexity about this domain — it returns citations we can check."""
    try:
        resp = requests.post(
            "https://api.perplexity.ai/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": "sonar",
                "messages": [
                    {
                        "role": "user",
                        "content": f"What is {domain}? What does the website {url} do?",
                    }
                ],
            },
            timeout=20,
        )
        if resp.status_code == 200:
            data = resp.json()
            text = data["choices"][0]["message"]["content"]
            citations = data.get("citations", [])
            domain_clean = domain.replace("www.", "")
            domain_cited = any(domain_clean in str(c) for c in citations)

            result = analyze_ai_response(text, domain)
            result["checked"] = True
            result["model"] = "Perplexity"
            result["rawResponse"] = text[:400]
            result["citations"] = citations[:5]
            result["domainCited"] = domain_cited
            if domain_cited:
                result["confidence"] = "high"
                result["known"] = True
            return result
        return {
            "checked": True,
            "known": False,
            "confidence": "none",
            "snippet": f"API error {resp.status_code}",
            "model": "Perplexity",
        }
    except Exception as e:
        return {
            "checked": True,
            "known": False,
            "confidence": "none",
            "snippet": f"Error: {e}",
            "model": "Perplexity",
        }


def query_gemini_visibility(domain, url, api_key):
    """Ask Gemini what it knows about this domain."""
    try:
        resp = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key={api_key}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [
                    {
                        "parts": [
                            {
                                "text": (
                                    f"What do you know about the website {domain} ({url})? "
                                    f"What does it do? Be concise and factual. "
                                    f"If you don't know, say so."
                                )
                            }
                        ]
                    }
                ]
            },
            timeout=20,
        )
        if resp.status_code == 200:
            data = resp.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            result = analyze_ai_response(text, domain)
            result["checked"] = True
            result["model"] = "Gemini"
            result["rawResponse"] = text[:400]
            return result
        return {
            "checked": True,
            "known": False,
            "confidence": "none",
            "snippet": f"API error {resp.status_code}",
            "model": "Gemini",
        }
    except Exception as e:
        return {
            "checked": True,
            "known": False,
            "confidence": "none",
            "snippet": f"Error: {e}",
            "model": "Gemini",
        }


def compute_ai_visibility(audit_data, robots_txt, page_html, soup, domain, url):
    """Compute full AI visibility analysis."""
    # 1. Check AI bot access in robots.txt
    bot_access = check_ai_bot_access(robots_txt)

    # 2. Check JS rendering
    js_rendering = check_js_rendering(page_html, soup)

    # 3. Structured data signals (reuse existing audit data)
    structured_data = {
        "hasJsonLd": audit_data.get("hasSchemaMarkup", False),
        "hasOpenGraph": bool(audit_data.get("ogTags", {}).get("title")),
        "hasMetaDescription": bool(audit_data.get("metaDescription")),
        "hasCanonical": bool(audit_data.get("canonical")),
        "hasTitle": bool(audit_data.get("title")),
    }

    # 4. Query AI models in parallel
    openai_key = os.environ.get("OPENAI_API_KEY")
    perplexity_key = os.environ.get("PERPLEXITY_API_KEY")
    gemini_key = os.environ.get("GOOGLE_API_KEY")

    raw_mentions = {}
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = {}
        futures[executor.submit(query_claude_visibility, domain, url)] = "claude"
        if openai_key:
            futures[
                executor.submit(query_openai_visibility, domain, url, openai_key)
            ] = "chatgpt"
        if perplexity_key:
            futures[
                executor.submit(
                    query_perplexity_visibility, domain, url, perplexity_key
                )
            ] = "perplexity"
        if gemini_key:
            futures[
                executor.submit(query_gemini_visibility, domain, url, gemini_key)
            ] = "gemini"

        for future in as_completed(futures):
            key = futures[future]
            try:
                raw_mentions[key] = future.result()
            except Exception as e:
                raw_mentions[key] = {
                    "checked": True,
                    "known": False,
                    "confidence": "none",
                    "snippet": str(e),
                    "model": key,
                }

    # Build ordered mentions dict (claude -> chatgpt -> perplexity -> gemini)
    mentions = {}
    for key, fallback in [
        ("claude", None),
        (
            "chatgpt",
            {
                "checked": False,
                "model": "ChatGPT",
                "reason": "Add OPENAI_API_KEY to .env",
            },
        ),
        (
            "perplexity",
            {
                "checked": False,
                "model": "Perplexity",
                "reason": "Add PERPLEXITY_API_KEY to .env",
            },
        ),
        (
            "gemini",
            {
                "checked": False,
                "model": "Gemini",
                "reason": "Add GOOGLE_API_KEY to .env",
            },
        ),
    ]:
        if key in raw_mentions:
            mentions[key] = raw_mentions[key]
        elif fallback:
            mentions[key] = fallback
        else:
            mentions[key] = {
                "checked": True,
                "known": False,
                "confidence": "none",
                "snippet": "Query failed",
                "model": "Claude",
            }

    # 5. Compute scores
    total_bots = len(bot_access)
    allowed_bots = sum(1 for b in bot_access.values() if b["status"] == "allowed")
    bot_score = round(25 * allowed_bots / total_bots) if total_bots else 25

    if js_rendering.get("isJsHeavy") is None:
        content_score = 10
    elif js_rendering["isJsHeavy"]:
        content_score = 5
    else:
        content_score = 20

    sd_items = [
        structured_data["hasJsonLd"],
        structured_data["hasOpenGraph"],
        structured_data["hasMetaDescription"],
        structured_data["hasCanonical"],
        structured_data["hasTitle"],
    ]
    sd_score = round(20 * sum(1 for s in sd_items if s) / len(sd_items))

    checked = {k: v for k, v in mentions.items() if v.get("checked")}
    if checked:
        conf_map = {"high": 25, "medium": 17, "low": 8, "none": 0}
        m_scores = [
            conf_map.get(m.get("confidence", "none"), 0) for m in checked.values()
        ]
        mention_score = round(sum(m_scores) / len(m_scores))
    else:
        mention_score = 0

    cite_pts = 0
    if audit_data.get("title"):
        cite_pts += 2
    if audit_data.get("metaDescription"):
        cite_pts += 2
    if audit_data.get("canonical"):
        cite_pts += 2
    if audit_data.get("hasSchemaMarkup"):
        cite_pts += 2
    if audit_data.get("h1Tags"):
        cite_pts += 2
    cite_score = min(cite_pts, 10)

    total_score = min(
        bot_score + content_score + sd_score + mention_score + cite_score, 100
    )

    # 6. Generate findings
    findings = []
    blocked = [b for b in bot_access.values() if b["status"] == "blocked"]
    if blocked:
        findings.append(
            {
                "issue": f"{len(blocked)} AI crawler(s) blocked in robots.txt: {', '.join(b['name'] for b in blocked)}",
                "severity": "high",
                "category": "bot-access",
            }
        )
    if js_rendering.get("isJsHeavy"):
        findings.append(
            {
                "issue": "Page content requires JavaScript — AI crawlers may see an empty page",
                "severity": "high",
                "category": "content-access",
            }
        )
    if not structured_data["hasJsonLd"]:
        findings.append(
            {
                "issue": "No JSON-LD structured data — AI models rely on this to understand page content",
                "severity": "high",
                "category": "structured-data",
            }
        )
    if not structured_data["hasOpenGraph"]:
        findings.append(
            {
                "issue": "Missing Open Graph tags — reduces AI ability to extract and cite content",
                "severity": "medium",
                "category": "structured-data",
            }
        )
    if not structured_data["hasMetaDescription"]:
        findings.append(
            {
                "issue": "No meta description — AI uses this as a primary content summary",
                "severity": "medium",
                "category": "structured-data",
            }
        )
    if not structured_data["hasCanonical"]:
        findings.append(
            {
                "issue": "No canonical URL — AI may not know which page version to cite",
                "severity": "low",
                "category": "citation",
            }
        )
    for bk, m in mentions.items():
        if m.get("checked") and not m.get("known"):
            findings.append(
                {
                    "issue": f"{m.get('model', bk)} does not appear to have knowledge of this site",
                    "severity": "medium",
                    "category": "visibility",
                }
            )

    # 7. Recommendations
    recommendations = []
    if blocked:
        names = ", ".join(b["name"] for b in blocked)
        recommendations.append(
            {
                "title": "Unblock AI Crawlers",
                "description": f"Remove Disallow rules for {names} in robots.txt to let AI models index your content.",
                "priority": "high",
            }
        )
    if js_rendering.get("isJsHeavy"):
        recommendations.append(
            {
                "title": "Enable Server-Side Rendering",
                "description": "AI crawlers don't execute JavaScript. Use SSR or pre-rendering so content is in the raw HTML.",
                "priority": "high",
            }
        )
    if not structured_data["hasJsonLd"]:
        recommendations.append(
            {
                "title": "Add JSON-LD Schema Markup",
                "description": "Add schema.org JSON-LD (Organization, WebSite, Article) so AI models understand and cite your content.",
                "priority": "high",
            }
        )
    if not structured_data["hasOpenGraph"]:
        recommendations.append(
            {
                "title": "Add Open Graph Tags",
                "description": "Add og:title, og:description, og:image, og:url to improve how AI extracts your content.",
                "priority": "medium",
            }
        )
    if not structured_data["hasMetaDescription"]:
        recommendations.append(
            {
                "title": "Add Meta Description",
                "description": "Write a concise meta description — AI models use it as a primary content descriptor.",
                "priority": "medium",
            }
        )
    recommendations.append(
        {
            "title": "Create an llms.txt File",
            "description": "Add an /llms.txt file with a Markdown summary of your site — an emerging standard for AI discoverability.",
            "priority": "medium",
        }
    )
    recommendations.append(
        {
            "title": "Add FAQ with Schema",
            "description": "Create FAQ pages with FAQPage schema — AI chatbots frequently source answers from structured FAQs.",
            "priority": "medium",
        }
    )
    if total_score < 50:
        recommendations.append(
            {
                "title": "Build Topical Authority",
                "description": "Create comprehensive, interlinked content on core topics. AI favors authoritative, well-structured sites.",
                "priority": "medium",
            }
        )

    return {
        "score": total_score,
        "botAccess": bot_access,
        "jsRendering": js_rendering,
        "structuredData": structured_data,
        "mentions": mentions,
        "findings": findings,
        "recommendations": recommendations,
        "breakdown": {
            "botAccess": bot_score,
            "contentAccessibility": content_score,
            "structuredData": sd_score,
            "aiMentions": mention_score,
            "citationReadiness": cite_score,
        },
    }


def parse_github_url(repo_url):
    """Extract owner and repo from a GitHub URL."""
    match = re.search(r"github\.com/([^/]+)/([^/\s#?]+)", repo_url)
    if match:
        owner = match.group(1)
        repo = match.group(2).rstrip(".git")
        return owner, repo
    return None, None


def github_api_get(endpoint, token=None):
    """Make a GET request to GitHub API."""
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "GeoAgent-SEO-Auditor/1.0",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    try:
        resp = requests.get(
            f"https://api.github.com{endpoint}", headers=headers, timeout=15
        )
        return resp
    except Exception:
        return None


def detect_client_prefix(tree_paths):
    """Detect if the frontend code lives in a subfolder (monorepo structure).
    Returns the prefix string (e.g. 'client/') or '' if at root."""
    common_prefixes = [
        "client/", "frontend/", "web/", "app/", "site/",
        "packages/web/", "packages/client/", "packages/frontend/",
        "apps/web/", "apps/frontend/", "apps/client/",
    ]
    # Check for framework indicators under each prefix
    framework_files = [
        "package.json", "next.config.js", "next.config.mjs", "next.config.ts",
        "vite.config.js", "vite.config.ts", "nuxt.config.js", "nuxt.config.ts",
        "angular.json", "gatsby-config.js", "svelte.config.js",
        "astro.config.mjs", "public/index.html", "src/App.js", "src/App.jsx",
        "src/App.tsx", "index.html",
    ]
    path_set = set(tree_paths)
    for prefix in common_prefixes:
        for ff in framework_files:
            if f"{prefix}{ff}" in path_set:
                return prefix
    return ""


def detect_framework(tree_paths, prefix=""):
    """Detect the web framework from repo file tree."""
    indicators = {
        "Next.js": ["next.config.js", "next.config.mjs", "next.config.ts"],
        "Nuxt": ["nuxt.config.js", "nuxt.config.ts"],
        "Gatsby": ["gatsby-config.js", "gatsby-config.ts"],
        "SvelteKit": ["svelte.config.js"],
        "Astro": ["astro.config.mjs", "astro.config.ts"],
        "Vite + React": ["vite.config.js", "vite.config.ts"],
        "Create React App": ["public/manifest.json", "src/App.js", "src/App.tsx"],
        "Angular": ["angular.json"],
        "Vue CLI": ["vue.config.js"],
        "Hugo": ["config.toml", "hugo.toml"],
        "Jekyll": ["_config.yml"],
    }
    path_set = set(tree_paths)
    for framework, files in indicators.items():
        for f in files:
            if f"{prefix}{f}" in path_set:
                return framework
    # Check for static HTML
    html_files = [p for p in tree_paths if p.startswith(prefix) and p.endswith(".html")]
    if html_files:
        return "Static HTML"
    return "Unknown"


def find_route_files(tree_paths, framework, prefix=""):
    """Identify which files would contain route/page information."""
    route_files = []

    if framework in ("Next.js",):
        for p in tree_paths:
            if (p.startswith(f"{prefix}app/") or p.startswith(f"{prefix}src/app/")) and (
                p.endswith("page.tsx")
                or p.endswith("page.jsx")
                or p.endswith("page.js")
                or p.endswith("page.ts")
            ):
                route_files.append(p)
            elif (p.startswith(f"{prefix}pages/") or p.startswith(f"{prefix}src/pages/")) and (
                p.endswith(".tsx") or p.endswith(".jsx") or p.endswith(".js")
            ):
                if not p.startswith(f"{prefix}pages/api/") and not p.startswith(
                    f"{prefix}src/pages/api/"
                ):
                    route_files.append(p)
    elif framework == "Nuxt":
        for p in tree_paths:
            if p.startswith(f"{prefix}pages/") and (
                p.endswith(".vue") or p.endswith(".tsx")
            ):
                route_files.append(p)
    elif framework == "Gatsby":
        for p in tree_paths:
            if p.startswith(f"{prefix}src/pages/") and (
                p.endswith(".tsx") or p.endswith(".jsx") or p.endswith(".js")
            ):
                route_files.append(p)
    elif framework == "SvelteKit":
        for p in tree_paths:
            if p.startswith(f"{prefix}src/routes/") and "+page.svelte" in p:
                route_files.append(p)
    elif framework == "Astro":
        for p in tree_paths:
            if p.startswith(f"{prefix}src/pages/") and (
                p.endswith(".astro") or p.endswith(".md") or p.endswith(".mdx")
            ):
                route_files.append(p)
    elif framework in ("Vite + React", "Create React App"):
        for p in tree_paths:
            if p.startswith(prefix) and any(
                name in p.lower()
                for name in ["app.jsx", "app.tsx", "app.js", "router", "routes"]
            ):
                route_files.append(p)
    elif framework == "Static HTML":
        for p in tree_paths:
            if p.startswith(prefix) and p.endswith(".html") and not p.startswith("."):
                route_files.append(p)
    elif framework in ("Hugo", "Jekyll"):
        for p in tree_paths:
            if p.startswith(f"{prefix}content/") or p.startswith(f"{prefix}_posts/"):
                route_files.append(p)
    else:
        for p in tree_paths:
            if p.startswith(prefix) and (
                p.endswith(".html") or "route" in p.lower() or "page" in p.lower()
            ):
                route_files.append(p)

    return route_files[:30]


def find_seo_files(tree_paths, framework, prefix=""):
    """Find files that should contain SEO meta tags (head, layout, document, HTML)."""
    seo_files = []
    candidates = [
        # Next.js
        "app/layout.tsx", "app/layout.jsx", "app/layout.js",
        "src/app/layout.tsx", "src/app/layout.jsx", "src/app/layout.js",
        "pages/_app.tsx", "pages/_app.jsx", "pages/_app.js",
        "pages/_document.tsx", "pages/_document.jsx", "pages/_document.js",
        "src/pages/_app.tsx", "src/pages/_app.jsx", "src/pages/_app.js",
        "src/pages/_document.tsx", "src/pages/_document.jsx",
        # Nuxt
        "app.vue", "layouts/default.vue", "nuxt.config.ts", "nuxt.config.js",
        # Gatsby
        "gatsby-ssr.js", "gatsby-ssr.tsx",
        "src/components/seo.js", "src/components/seo.tsx",
        "src/components/SEO.jsx", "src/components/head.jsx",
        # SvelteKit
        "src/app.html",
        # Astro
        "src/layouts/Layout.astro", "src/layouts/BaseLayout.astro",
        # Vite / CRA
        "index.html", "public/index.html",
        # General
        "src/index.html",
        # App entry points (often contain <Helmet> or document head logic)
        "src/App.js", "src/App.jsx", "src/App.tsx",
        "src/index.js", "src/index.jsx", "src/index.tsx",
    ]
    for c in candidates:
        full_path = f"{prefix}{c}"
        if full_path in tree_paths:
            seo_files.append(full_path)

    # Also grab any .html files under the prefix at root or one level deep
    for p in tree_paths:
        if p.startswith(prefix) and p.endswith(".html") and p not in seo_files:
            relative = p[len(prefix):]
            parts = relative.split("/")
            if len(parts) <= 2:  # root or one level deep within prefix
                seo_files.append(p)

    return seo_files[:8]


def fetch_file_content(owner, repo, path, branch, token):
    """Fetch a single file's content from GitHub."""
    resp = github_api_get(
        f"/repos/{owner}/{repo}/contents/{path}?ref={branch}", token
    )
    if resp and resp.status_code == 200:
        data = resp.json()
        if data.get("encoding") == "base64" and data.get("size", 0) < 100000:
            return base64.b64decode(data["content"]).decode("utf-8", errors="replace")
    return None


def generate_seo_diffs(owner, repo, default_branch, homepage, description, framework, tree_paths, token, prefix=""):
    """Use Claude to scan key files and generate unified diffs for SEO improvements."""
    seo_files = find_seo_files(tree_paths, framework, prefix)
    if not seo_files:
        return []

    file_contents = {}
    for sf in seo_files:
        content = fetch_file_content(owner, repo, sf, default_branch, token)
        if content:
            file_contents[sf] = content[:5000]

    if not file_contents:
        return []

    files_context = ""
    for path, content in file_contents.items():
        files_context += f"\n=== {path} ===\n{content}\n"

    prompt = f"""You are an expert SEO engineer. I have a website repository ({framework} framework).
Homepage: {homepage}
Description: {description}

Here are the key files that control the HTML head / layout / meta tags:
{files_context}

Analyze these files for SEO issues and generate unified diffs to fix them. Check for:
1. Missing or inadequate <title> tag
2. Missing <meta name="description"> tag
3. Missing Open Graph tags (og:title, og:description, og:image, og:url, og:type)
4. Missing Twitter card meta tags (twitter:card, twitter:title, twitter:description)
5. Missing canonical <link> tag
6. Missing lang attribute on <html>
7. Missing viewport meta tag
8. Missing or missing structured data / JSON-LD schema markup
9. Missing favicon link
10. Any other SEO best practice improvements

For each file that needs changes, generate a unified diff (like `git diff` output).
Only include files that actually need changes. Be practical — don't suggest changes for things already present.

Return a JSON object with this exact structure:
{{
  "diffs": [
    {{
      "filePath": "<relative path to file>",
      "description": "<1 sentence explaining what this diff fixes>",
      "severity": "high|medium|low",
      "diff": "<unified diff string with --- a/ and +++ b/ headers, @@ line markers, and +/- lines>"
    }}
  ]
}}

Rules for the diff format:
- Use proper unified diff format with --- a/filename and +++ b/filename headers
- Include @@ line number markers
- Lines starting with + are additions (green)
- Lines starting with - are removals (red)
- Include 2-3 lines of unchanged context around each change
- Make the diffs as minimal as possible while being complete
- Each diff entry should focus on one logical SEO improvement

IMPORTANT: Return ONLY the raw JSON object. Do not wrap it in markdown code fences."""

    try:
        message = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=8192,
            messages=[{"role": "user", "content": prompt}],
        )
        response_text = message.content[0].text
        clean = re.sub(r"^```(?:json)?\s*", "", response_text.strip())
        clean = re.sub(r"\s*```$", "", clean.strip())
        json_match = re.search(r"\{[\s\S]*\}", clean)
        if json_match:
            result = json.loads(json_match.group(0))
            return result.get("diffs", [])
    except Exception as e:
        print(f"SEO diff generation error: {e}")
    return []


@app.route("/api/analyze-repo", methods=["POST"])
@require_auth
def analyze_repo():
    data = request.get_json()
    repo_url = data.get("repoUrl")

    if not repo_url:
        return jsonify({"error": "Repository URL is required"}), 400

    owner, repo = parse_github_url(repo_url)
    if not owner or not repo:
        return (
            jsonify(
                {
                    "error": "Invalid GitHub URL. Expected format: https://github.com/owner/repo"
                }
            ),
            400,
        )

    token = os.environ.get("GITHUB_TOKEN")

    try:
        # 1. Fetch repo metadata
        repo_resp = github_api_get(f"/repos/{owner}/{repo}", token)
        if not repo_resp or repo_resp.status_code != 200:
            error_msg = "Repository not found. Make sure it's a public repo."
            if repo_resp and repo_resp.status_code == 403:
                error_msg = "GitHub API rate limit exceeded. Try adding a GITHUB_TOKEN to your .env file."
            return jsonify({"error": error_msg}), 400

        repo_data = repo_resp.json()
        default_branch = repo_data.get("default_branch", "main")
        homepage = repo_data.get("homepage") or f"https://{owner}.github.io/{repo}"
        description = repo_data.get("description", "") or ""

        # 2. Fetch full file tree
        tree_resp = github_api_get(
            f"/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1", token
        )
        if not tree_resp or tree_resp.status_code != 200:
            return jsonify({"error": "Failed to fetch repository file tree"}), 400

        tree_data = tree_resp.json()
        tree_paths = [
            item["path"]
            for item in tree_data.get("tree", [])
            if item["type"] == "blob"
        ]

        # 3. Check for existing robots.txt and sitemap.xml
        prefix = detect_client_prefix(tree_paths)
        robots_candidates = [
            f"{prefix}robots.txt", f"{prefix}public/robots.txt",
            "robots.txt", "public/robots.txt",
        ]
        sitemap_candidates = [
            f"{prefix}sitemap.xml", f"{prefix}public/sitemap.xml",
            f"{prefix}static/sitemap.xml",
            "sitemap.xml", "public/sitemap.xml", "static/sitemap.xml",
        ]
        # Deduplicate while preserving order
        robots_candidates = list(dict.fromkeys(robots_candidates))
        sitemap_candidates = list(dict.fromkeys(sitemap_candidates))

        has_robots = any(p in tree_paths for p in robots_candidates)
        has_sitemap = any(p in tree_paths for p in sitemap_candidates)

        existing_robots = None
        existing_sitemap = None

        if has_robots:
            robots_path = next(p for p in robots_candidates if p in tree_paths)
            content_resp = github_api_get(
                f"/repos/{owner}/{repo}/contents/{robots_path}?ref={default_branch}",
                token,
            )
            if content_resp and content_resp.status_code == 200:
                content_data = content_resp.json()
                if content_data.get("encoding") == "base64":
                    existing_robots = base64.b64decode(
                        content_data["content"]
                    ).decode("utf-8", errors="replace")

        if has_sitemap:
            for sp in sitemap_candidates:
                if sp in tree_paths:
                    content_resp = github_api_get(
                        f"/repos/{owner}/{repo}/contents/{sp}?ref={default_branch}",
                        token,
                    )
                    if content_resp and content_resp.status_code == 200:
                        content_data = content_resp.json()
                        if content_data.get("encoding") == "base64":
                            existing_sitemap = base64.b64decode(
                                content_data["content"]
                            ).decode("utf-8", errors="replace")
                    break

        # 4. If both exist, still scan for SEO improvements
        framework = detect_framework(tree_paths, prefix)
        if has_robots and has_sitemap:
            seo_diffs = generate_seo_diffs(
                owner, repo, default_branch, homepage, description,
                framework, tree_paths, token, prefix
            )
            return jsonify(
                {
                    "success": True,
                    "repoInfo": {
                        "owner": owner,
                        "repo": repo,
                        "homepage": homepage,
                        "description": description,
                        "framework": framework,
                    },
                    "findings": {
                        "hasRobots": True,
                        "hasSitemap": True,
                        "existingRobots": existing_robots,
                        "existingSitemap": existing_sitemap,
                    },
                    "generated": {},
                    "seoDiffs": seo_diffs,
                }
            )

        # 5. Collect context for Claude
        route_files = find_route_files(tree_paths, framework, prefix)

        route_file_contents = {}
        for rf in route_files[:10]:
            rf_resp = github_api_get(
                f"/repos/{owner}/{repo}/contents/{rf}?ref={default_branch}", token
            )
            if rf_resp and rf_resp.status_code == 200:
                rf_data = rf_resp.json()
                if (
                    rf_data.get("encoding") == "base64"
                    and rf_data.get("size", 0) < 50000
                ):
                    route_file_contents[rf] = base64.b64decode(
                        rf_data["content"]
                    ).decode("utf-8", errors="replace")[:3000]

        pkg_json = None
        pkg_path = f"{prefix}package.json" if f"{prefix}package.json" in tree_paths else ("package.json" if "package.json" in tree_paths else None)
        if pkg_path:
            pkg_resp = github_api_get(
                f"/repos/{owner}/{repo}/contents/{pkg_path}?ref={default_branch}",
                token,
            )
            if pkg_resp and pkg_resp.status_code == 200:
                pkg_data = pkg_resp.json()
                if pkg_data.get("encoding") == "base64":
                    pkg_json = base64.b64decode(pkg_data["content"]).decode(
                        "utf-8", errors="replace"
                    )

        # 6. Build Claude prompt
        context_parts = [
            f"Repository: {owner}/{repo}",
            f"Homepage URL: {homepage}",
            f"Description: {description}",
            f"Detected framework: {framework}",
            f"Default branch: {default_branch}",
            f"\nFile tree (all paths):\n" + "\n".join(tree_paths[:200]),
        ]

        if route_file_contents:
            context_parts.append("\n--- Route/Page files content ---")
            for path, content in route_file_contents.items():
                context_parts.append(f"\n=== {path} ===\n{content}")

        if pkg_json:
            context_parts.append(f"\n--- package.json ---\n{pkg_json[:2000]}")

        if existing_robots:
            context_parts.append(
                f"\n--- Existing robots.txt ---\n{existing_robots}"
            )

        if existing_sitemap:
            context_parts.append(
                f"\n--- Existing sitemap.xml ---\n{existing_sitemap}"
            )

        missing_items = []
        if not has_robots:
            missing_items.append("robots.txt")
        if not has_sitemap:
            missing_items.append("sitemap.xml")

        prompt = f"""You are an expert SEO engineer and web developer.

I have a GitHub repository for a website. Based on the repository structure and code below, generate the missing SEO files.

{chr(10).join(context_parts)}

MISSING FILES TO GENERATE: {', '.join(missing_items)}

Instructions:
- For robots.txt: Create an appropriate robots.txt considering the framework ({framework}). Include sensible User-agent rules, Disallow paths for non-public directories (like /api/, /_next/, /admin/, etc.), and a Sitemap directive pointing to {homepage}/sitemap.xml.
- For sitemap.xml: Create a valid XML sitemap. Analyze the route/page files to discover all public pages. Use {homepage} as the base URL. Include <lastmod>, <changefreq>, and <priority> tags. The homepage should have priority 1.0.

Return a valid JSON object with this exact structure:
{{
  "robotsTxt": "<full robots.txt content as a string, or null if not needed>",
  "sitemapXml": "<full sitemap.xml content as a string, or null if not needed>",
  "explanation": {{
    "robots": "<1-2 sentences explaining the robots.txt choices>",
    "sitemap": "<1-2 sentences explaining discovered routes and sitemap structure>"
  }}
}}

IMPORTANT: Return ONLY the raw JSON object. Do not wrap it in markdown code fences."""

        message = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=8192,
            messages=[{"role": "user", "content": prompt}],
        )

        response_text = message.content[0].text

        # Parse response
        clean = re.sub(r"^```(?:json)?\s*", "", response_text.strip())
        clean = re.sub(r"\s*```$", "", clean.strip())
        json_match = re.search(r"\{[\s\S]*\}", clean)

        if not json_match:
            print("Claude raw response:", response_text)
            return (
                jsonify({"error": "Failed to parse Claude generation response"}),
                500,
            )

        try:
            generated = json.loads(json_match.group(0))
        except json.JSONDecodeError as e:
            print("JSON decode error:", e)
            return jsonify({"error": f"JSON decode error: {e}"}), 500

        # 8. Generate SEO improvement diffs
        seo_diffs = generate_seo_diffs(
            owner, repo, default_branch, homepage, description,
            framework, tree_paths, token, prefix
        )

        result_payload = {
            "success": True,
            "repoInfo": {
                "owner": owner,
                "repo": repo,
                "homepage": homepage,
                "description": description,
                "framework": framework,
            },
            "findings": {
                "hasRobots": has_robots,
                "hasSitemap": has_sitemap,
                "existingRobots": existing_robots,
                "existingSitemap": existing_sitemap,
            },
            "generated": generated,
            "seoDiffs": seo_diffs,
        }

        # Save to history
        try:
            save_analysis(g.user_id, "github", repo_url, result_payload)
        except Exception as save_err:
            print(f"Failed to save repo analysis: {save_err}")

        return jsonify(result_payload)

    except Exception as e:
        import traceback

        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ---------- Health-check endpoint ----------
@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


# ---------- Admin stats endpoint ----------
@app.route("/api/admin/stats")
def admin_stats():
    secret = request.args.get("key")
    if secret != os.environ.get("ADMIN_SECRET", "geode-admin-2026"):
        return jsonify({"error": "unauthorized"}), 401

    from db import get_db
    conn = get_db()
    try:
        user_count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        analysis_count = conn.execute("SELECT COUNT(*) FROM analyses").fetchone()[0]

        # Analyses by mode
        mode_breakdown = [
            dict(row) for row in conn.execute(
                "SELECT mode, COUNT(*) as count FROM analyses GROUP BY mode"
            ).fetchall()
        ]

        # Daily analyses (last 30 days)
        daily_analyses = [
            dict(row) for row in conn.execute(
                "SELECT DATE(created_at) as date, COUNT(*) as count "
                "FROM analyses WHERE created_at >= datetime('now', '-30 days') "
                "GROUP BY DATE(created_at) ORDER BY date"
            ).fetchall()
        ]

        # Daily signups (last 30 days)
        daily_signups = [
            dict(row) for row in conn.execute(
                "SELECT DATE(created_at) as date, COUNT(*) as count "
                "FROM users WHERE created_at >= datetime('now', '-30 days') "
                "GROUP BY DATE(created_at) ORDER BY date"
            ).fetchall()
        ]

        # Average score
        avg_score_row = conn.execute(
            "SELECT AVG(score) as avg_score FROM analyses WHERE score IS NOT NULL"
        ).fetchone()
        avg_score = round(avg_score_row["avg_score"], 1) if avg_score_row["avg_score"] else 0

        # Top users by analysis count
        top_users = [
            dict(row) for row in conn.execute(
                "SELECT u.name, u.email, u.picture_url, COUNT(a.id) as analysis_count, "
                "u.created_at FROM users u LEFT JOIN analyses a ON u.id = a.user_id "
                "GROUP BY u.id ORDER BY analysis_count DESC LIMIT 10"
            ).fetchall()
        ]

        recent_users = [
            dict(row) for row in conn.execute(
                "SELECT name, email, picture_url, created_at FROM users ORDER BY created_at DESC LIMIT 20"
            ).fetchall()
        ]
        recent_analyses = [
            dict(row) for row in conn.execute(
                "SELECT u.name, u.email, a.mode, a.input, a.score, a.created_at "
                "FROM analyses a JOIN users u ON a.user_id = u.id "
                "ORDER BY a.created_at DESC LIMIT 30"
            ).fetchall()
        ]
        return jsonify({
            "total_users": user_count,
            "total_analyses": analysis_count,
            "avg_score": avg_score,
            "mode_breakdown": mode_breakdown,
            "daily_analyses": daily_analyses,
            "daily_signups": daily_signups,
            "top_users": top_users,
            "recent_users": recent_users,
            "recent_analyses": recent_analyses,
        })
    finally:
        conn.close()


# ---------- Serve React SPA for non-API routes ----------
if HAS_STATIC:
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_spa(path):
        # If the file exists in the static build, serve it
        full_path = os.path.join(STATIC_DIR, path)
        if path and os.path.isfile(full_path):
            return send_from_directory(STATIC_DIR, path)
        # Otherwise serve index.html (SPA client-side routing)
        return send_from_directory(STATIC_DIR, "index.html")


if __name__ == "__main__":
    app.run(debug=True, port=5001, threaded=True)
