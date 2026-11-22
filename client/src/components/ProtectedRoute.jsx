import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p className="page-status">Loading...</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (role && user.role !== role) {
    return (
      <Navigate
        to={user.role === 'doctor' ? '/doctor' : '/readings'}
        replace
      />
    );
  }

  return <Outlet />;
}