import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import OptimizerPage from './pages/OptimizerPage';
import LoginPage from './pages/LoginPage';
import HistoryPage from './pages/HistoryPage';
import MyDashboard from './pages/MyDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <MyDashboard />
          </ProtectedRoute>
        } />
        <Route path="/optimizer" element={
          <ProtectedRoute>
            <OptimizerPage />
          </ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;