import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home.jsx';
import CitizenPortal from './pages/CitizenPortal.jsx';
import DispatchPortal from './pages/DispatchPortal.jsx';
import FieldPortal from './pages/FieldPortal.jsx';
import Privacy from './pages/Privacy.jsx';
import Terms from './pages/Terms.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error.toString() };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 text-red-600">
          <h1 className="text-2xl font-bold mb-4">Something went wrong.</h1>
          <p className="font-mono bg-red-100 p-4 rounded">{this.state.errorMsg}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function DemoNavbar() {
  return (
    <nav className="bg-slate-900 text-white p-4 sticky top-0 z-50 flex justify-between items-center shadow-md">
      <div className="font-bold text-xl tracking-tight">Geo-Elastic Routing Engine</div>
      <div className="flex gap-4">
        <Link to="/" className="hover:text-orange-400 transition">Home</Link>
        <Link to="/citizen" className="hover:text-orange-400 transition">Citizen Intake</Link>
        <Link to="/dispatch" className="hover:text-orange-400 transition">Dispatch Hub</Link>
        <Link to="/field" className="hover:text-orange-400 transition">Field Desk</Link>
      </div>
      <div className="flex items-center gap-2">
         <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
         <span className="text-sm text-slate-300">Live Demo</span>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <DemoNavbar />
        <ErrorBoundary>
            <main className="flex-grow flex flex-col">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/citizen" element={<CitizenPortal />} />
                <Route path="/dispatch" element={<DispatchPortal />} />
                <Route path="/field" element={<FieldPortal />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/terms" element={<Terms />} />
              </Routes>
            </main>
        </ErrorBoundary>
      </div>
    </Router>
  );
}

export default App;
