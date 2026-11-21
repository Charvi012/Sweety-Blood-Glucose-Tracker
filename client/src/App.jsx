import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ReadingsPage from './pages/ReadingsPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import DoctorPage from './pages/DoctorPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Patient-only pages */}
      <Route element={<ProtectedRoute role="patient" />}>
        <Route element={<Layout />}>
          <Route path="/readings" element={<ReadingsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>
      </Route>

      {/* Doctor-only pages */}
      <Route element={<ProtectedRoute role="doctor" />}>
        <Route element={<Layout />}>
          <Route path="/doctor" element={<DoctorPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/readings" replace />} />
    </Routes>
  );
}