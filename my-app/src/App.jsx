import { BrowserRouter, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import OptimizerPage from './pages/OptimizerPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/optimizer" element={<OptimizerPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;