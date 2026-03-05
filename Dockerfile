# ---- Stage 1: Build React frontend ----
FROM node:20-slim AS frontend-build

WORKDIR /app/my-app
COPY my-app/package*.json ./
RUN npm ci --legacy-peer-deps

COPY my-app/ ./

# Pass Google Client ID at build time so Vite can inline it
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN npm run build

# ---- Stage 2: Python API + static files ----
FROM python:3.12-slim

WORKDIR /app

# Install Python dependencies
COPY api/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Copy API code
COPY api/ ./

# Copy built frontend into /app/static
COPY --from=frontend-build /app/my-app/dist ./static

EXPOSE 5001

CMD ["gunicorn", "app:app", "--bind", "0.0.0.0:5001", "--workers", "2", "--threads", "4", "--timeout", "120"]
