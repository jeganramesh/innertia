import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProviderWithManager } from './components/ui/Toast';
import { ClassesPage } from './pages/ClassesPage';
import { UploadPage } from './pages/UploadPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';

function App() {
  return (
    <ToastProviderWithManager>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/classes" replace />} />
          <Route path="/classes" element={<ClassesPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/classes" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProviderWithManager>
  );
}

export default App;
