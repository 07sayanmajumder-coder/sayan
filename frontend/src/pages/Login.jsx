
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, googleLogin, user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: ''
  });

  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  // Email and password login
  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Google login
  async function handleGoogleLogin() {
    setError('');
    setGoogleLoading(true);

    try {
      await googleLogin();
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Google login failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">

        <p className="eyebrow">WELCOME BACK</p>
        <h1>Log In</h1>

        <p className="muted">
          Log in to continue to ticket booking.
        </p>

        {error && (
          <p className="error-message">{error}</p>
        )}

        <form className="stack-form" onSubmit={submit}>

          <label>
            Email address
            <input
              className="field"
              type="email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />
          </label>

          <label>
            Password

            <div className="password-wrapper">
              <input
                className="field"
                type={showPassword ? 'text' : 'password'}
                name="password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </label>

          <button
            className="button primary full-width"
            type="submit"
            disabled={loading || googleLoading}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>

        </form>

        {/* OR separator */}
        <div className="auth-divider">
          <span>OR</span>
        </div>

        {/* Google Login */}
        <button
          type="button"
          className="google-login-button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
        >
          <svg
            className="google-icon"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.73 7.18l7.25 5.62c4.23-3.91 6.67-9.67 6.67-17.27z"
            />
            <path
              fill="#FBBC05"
              d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.75-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.88.93 7.54 2.56 10.78l7.97-6.19z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.91-5.78l-7.25-5.62c-2.01 1.35-4.59 2.15-8.66 2.15-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
            />
          </svg>

          <span>
            {googleLoading ? 'Connecting to Google...' : 'Continue with Google'}
          </span>
        </button>

        <p className="auth-switch">
          Don't have an account?{' '}
          <Link to="/signup">Sign Up</Link>
        </p>

      </div>
    </section>
  );
}
