
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <header className="site-header">
      <NavLink to="/" className="brand">
        🚆 Where is my Train
      </NavLink>

      <nav className="nav-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/about">About</NavLink>
        <NavLink to="/contact">Contact</NavLink>
        <NavLink to="/my-bookings">My Bookings</NavLink>

        {user ? (
          <>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/book-ticket" className="nav-cta">
              Book Ticket
            </NavLink>
            <span className="welcome-user">Hi, {user.name}</span>
            <button className="nav-button" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="nav-login">
              Log in
            </NavLink>

            <NavLink to="/signup" className="nav-cta">
              Sign Up
            </NavLink>
          </>
        )}
      </nav>
    </header>
  );
}
