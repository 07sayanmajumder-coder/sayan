
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Moon, Sun } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Restore the previously selected theme.
  const [theme, setTheme] = useState(
    () => localStorage.getItem("railway-theme") || "dark"
  );

  // Apply the selected theme to the entire page.
  useEffect(() => {
    document.body.classList.remove("dark-theme", "light-theme");
    document.body.classList.add(`${theme}-theme`);

    localStorage.setItem("railway-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((currentTheme) =>
      currentTheme === "dark" ? "light" : "dark"
    );
  }

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="site-header">
      <NavLink to="/" className="brand">
        🚆 Where is my Train
      </NavLink>

      <nav className="nav-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/about">About</NavLink>

        {user ? (
          <>
            <NavLink to="/help">Help</NavLink>

            <NavLink to="/my-bookings">My Bookings</NavLink>

            <NavLink to="/dashboard">Dashboard</NavLink>

            <NavLink to="/book-ticket" className="nav-cta">
              Book Ticket
            </NavLink>

            <NotificationBell />

            <span className="welcome-user">
              Hi, {user.name}
            </span>

            <button
              className="nav-button"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/contact">Contact</NavLink>

            <NavLink to="/login" className="nav-login">
              Log in
            </NavLink>

            <NavLink to="/signup" className="nav-cta">
              Sign Up
            </NavLink>
          </>
        )}

        {/* Dark / Light Theme Toggle */}
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          aria-label={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
        >
          {theme === "dark" ? (
            <Sun size={19} />
          ) : (
            <Moon size={19} />
          )}

          <span>{theme === "dark" ? "Light" : "Dark"}</span>
        </button>
      </nav>
    </header>
  );
}
