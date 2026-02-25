import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ShelfPage from './pages/ShelfPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#0f172a] text-slate-200 selection:bg-blue-500/30">
        {/* 背景漸層 */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full" />
        </div>

        <Navbar />

        <main className="relative pt-24 pb-12 px-6 max-w-7xl mx-auto">
          <Routes>
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
