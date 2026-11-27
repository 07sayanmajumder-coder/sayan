
import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu, X, Moon, Sun } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Restore the previously selected theme.
  const [theme, setTheme] = useState(
    () => localStorage.getItem("railway-theme") || "dark"
  );

  // Apply the selected theme.
  useEffect(() => {
    document.body.classList.remove("dark-theme", "light-theme");
    document.body.classList.add(`${theme}-theme`);

    localStorage.setItem("railway-theme", theme);
  }, [theme]);

  // Close sidebar when Escape is pressed.
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsSidebarOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  function toggleTheme() {
    setTheme((currentTheme) =>
      currentTheme === "dark" ? "light" : "dark"
    );
  }

  function closeSidebar() {
    setIsSidebarOpen(false);
  }

  function handleLogout() {
    closeSidebar();
    logout();
    navigate("/");
  }

  return (
    <>
      {/* Top navigation bar */}
      <header className="site-header">
        <button
          type="button"
          className="sidebar-toggle"
          onClick={() => setIsSidebarOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={isSidebarOpen}
          aria-controls="main-sidebar"
        >
          <Menu size={25} />
        </button>

        <NavLink to="/" className="brand" onClick={closeSidebar}>
          🚆 Where is my Train
        </NavLink>
      </header>

      {/* Background overlay */}
      <div
        className={`sidebar-overlay ${isSidebarOpen ? "show" : ""}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      {/* Side navigation */}
      <aside
        id="main-sidebar"
        className={`navigation-sidebar ${isSidebarOpen ? "open" : ""}`}
        aria-hidden={!isSidebarOpen}
      >
        <div className="sidebar-header">
          <NavLink
            to="/"
            className="sidebar-brand"
            onClick={closeSidebar}
          >
            🚆 Where is my Train
          </NavLink>

          <button
            type="button"
            className="sidebar-close"
            onClick={closeSidebar}
            aria-label="Close navigation menu"
          >
            <X size={25} />
          </button>
        </div>

        <nav className="sidebar-links">
          <NavLink to="/" onClick={closeSidebar}>
            Home
          </NavLink>

          <NavLink to="/about" onClick={closeSidebar}>
            About
          </NavLink>

          {user ? (
            <>
              <NavLink to="/help" onClick={closeSidebar}>
                Help
              </NavLink>

              <NavLink to="/my-bookings" onClick={closeSidebar}>
                My Bookings
              </NavLink>

              <NavLink to="/dashboard" onClick={closeSidebar}>
                Dashboard
              </NavLink>

              <NavLink
                to="/book-ticket"
                className="nav-cta"
                onClick={closeSidebar}
              >
                Book Ticket
              </NavLink>

              <div className="sidebar-notification">
                <NotificationBell />
                <span>Notifications</span>
              </div>

              <div className="sidebar-user">
                Hi, {user.name}
              </div>

              <button
                type="button"
                className="nav-button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink to="/contact" onClick={closeSidebar}>
                Contact
              </NavLink>

              <NavLink
                to="/login"
                className="nav-login"
                onClick={closeSidebar}
              >
                Log in
              </NavLink>

              <NavLink
                to="/signup"
                className="nav-cta"
                onClick={closeSidebar}
              >
                Sign Up
              </NavLink>
            </>
          )}
        </nav>

        {/* Theme switcher */}
        <div className="sidebar-theme">
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

            <span>
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
          </button>
        </div>
      </aside>
    </>
  );
}
