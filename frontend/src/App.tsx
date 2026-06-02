import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import ThreatAnalysis from './pages/ThreatAnalysis';
import IOCExplorer from './pages/IOCExplorer';
import MitreMapping from './pages/MitreMapping';
import DetectionRules from './pages/DetectionRules';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a2235',
            color: '#f3f4f6',
            border: '1px solid #1F2937',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#22C55E', secondary: '#111827' } },
          error: { iconTheme: { primary: '#EF4444', secondary: '#111827' } },
        }}
      />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/analyze" element={<ThreatAnalysis />} />
          <Route path="/iocs" element={<IOCExplorer />} />
          <Route path="/mitre" element={<MitreMapping />} />
          <Route path="/detection" element={<DetectionRules />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
