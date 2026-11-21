import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <>
      <header className="topbar">
        <span className="brand">Sweety</span>

        <nav aria-label="Main">
          {user.role === 'patient' ? (
            <>
              <NavLink to="/readings">Readings</NavLink>
              <NavLink to="/reports">Reports</NavLink>
            </>
          ) : (
            <NavLink to="/doctor">Doctor Dashboard</NavLink>
          )}
        </nav>

        <div className="topbar-user">
          <span>{user.name}</span>

          <button
            type="button"
            className="btn btn-quiet"
            onClick={handleLogout}
          >
            Log out
          </button>
        </div>
      </header>

      <main className="container">
        <Outlet />
      </main>
    </>
  );
}