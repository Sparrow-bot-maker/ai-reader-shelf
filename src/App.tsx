import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import ShelfPage from './pages/ShelfPage';

function App() {
  return (
    <Router basename="/ai-reader-shelf">
      <div className="min-h-screen bg-[#f6f6f8] text-gray-900 selection:bg-blue-200">
        <Navbar />
        <main className="relative pt-24 pb-12 px-6 max-w-7xl mx-auto">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/want-to-read" element={<ShelfPage status="想閱讀" />} />
            <Route path="/already-read" element={<ShelfPage status="已閱讀" />} />
            <Route path="/" element={<Navigate to="/want-to-read" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
