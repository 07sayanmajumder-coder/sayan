import { Navigate, Route, Routes } from 'react-router-dom';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Signup from './pages/Signup';
import BookTicket from './pages/BookTicket';
import TrainDetails from './pages/TrainDetails';
import BookingConfirmation from './pages/BookingConfirmation';
import BookingTicket from './pages/BookingTicket';
import MyBookings from './pages/MyBookings';
import { useAuth } from './context/AuthContext';

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
          <Route path="/" element={<Home />} />

          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/book-ticket"
            element={
              <ProtectedRoute>
                <BookTicket />
              </ProtectedRoute>
            }
          />

          <Route
            path="/booking-confirmation"
            element={
              <ProtectedRoute>
                <BookingConfirmation />
              </ProtectedRoute>
            }
          />
          <Route
  path="/my-bookings"
  element={
    <ProtectedRoute>
      <MyBookings />
    </ProtectedRoute>
  }
/>

          <Route
            path="/booking-ticket"
            element={
              <ProtectedRoute>
                <BookingTicket />
              </ProtectedRoute>
            }
          />

          {/* Live Train Details */}
          <Route
            path="/train/:trainNumber"
            element={
              <ProtectedRoute>
                <TrainDetails />
              </ProtectedRoute>
            }
          />

          {/* Keep the old train-details URL working */}
          <Route
            path="/train-details"
            element={
              <ProtectedRoute>
                <TrainDetails />
              </ProtectedRoute>
            }
          />

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