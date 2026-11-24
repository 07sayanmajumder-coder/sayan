
import { Navigate, Route, Routes } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import BookTicket from "./pages/BookTicket";
import TrainDetails from "./pages/TrainDetails";
import BookingConfirmation from "./pages/BookingConfirmation";
import BookingTicket from "./pages/BookingTicket";
import MyBookings from "./pages/MyBookings";
import Notifications from "./pages/Notifications";

import { useAuth } from "./context/AuthContext";
import Help from "./pages/Help";

function ProtectedRoute({ children }) {
  const { user } = useAuth();

  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />

      <main className="main-content">
        <Routes>
          {/* Public pages */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Notifications */}
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Ticket booking */}
          <Route
            path="/book-ticket"
            element={
              <ProtectedRoute>
                <BookTicket />
              </ProtectedRoute>
            }
          />

          {/* Booking confirmation */}
          <Route
            path="/booking-confirmation"
            element={
              <ProtectedRoute>
                <BookingConfirmation />
              </ProtectedRoute>
            }
          />

          {/* Booking ticket */}
          <Route
            path="/booking-ticket"
            element={
              <ProtectedRoute>
                <BookingTicket />
              </ProtectedRoute>
            }
          />

          {/* My bookings */}
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            }
          />

          {/* Train details */}
          <Route
            path="/train/:trainNumber"
            element={
              <ProtectedRoute>
                <TrainDetails />
              </ProtectedRoute>
            }
          />

          {/* Alternate train details URL */}
          <Route
            path="/train-details/:trainNumber"
            element={
              <ProtectedRoute>
                <TrainDetails />
              </ProtectedRoute>
            }
          />
          <Route
  path="/help"
  element={
    <ProtectedRoute>
      <Help />
    </ProtectedRoute>
  }
/>

          {/* Old URL compatibility */}
          <Route
            path="/train-details"
            element={
              <ProtectedRoute>
                <TrainDetails />
              </ProtectedRoute>
            }
          />

          {/* Unknown routes */}
          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}
