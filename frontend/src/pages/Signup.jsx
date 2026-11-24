
import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Signup() {
  const { signup, googleLogin, user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  // EMAIL SIGNUP
  async function submit(e) {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      return setError('Password must contain at least 6 characters.');
    }

    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match.');
    }

    try {
      setLoading(true);

      await signup({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
      });

      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // GOOGLE SIGNUP
  async function handleGoogleSignup() {
    setError('');

    try {
      setGoogleLoading(true);

      await googleLogin();

      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Google sign-up failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">

        <p className="eyebrow">JOIN US</p>

        <h1>Create Account</h1>

        <p className="muted">
          Sign up to access your train dashboard and booking features.
        </p>

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        <form className="stack-form" onSubmit={submit}>

          <label>
            Full name
            <input
              className="field"
              type="text"
              name="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Email address
            <input
              className="field"
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>

          {/* Password Field */}
          <label>
            Password

            <div className="password-wrapper">
              <input
                className="field"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Minimum 6 characters"
                minLength={6}
                value={form.password}
                onChange={handleChange}
                required
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

          {/* Confirm Password Field */}
          <label>
            Confirm password

            <div className="password-wrapper">
              <input
                className="field"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
                aria-label={
                  showConfirmPassword
                    ? 'Hide confirm password'
                    : 'Show confirm password'
                }
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </label>

          <button
            className="button primary full-width"
            type="submit"
            disabled={loading || googleLoading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>

        </form>

        {/* OR Separator */}
        <div className="auth-divider">
          <span>OR</span>
        </div>

        {/* Google Signup */}
        <button
          type="button"
          className="google-login-button"
          onClick={handleGoogleSignup}
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
            {googleLoading
              ? 'Connecting to Google...'
              : 'Continue with Google'}
          </span>
        </button>

        <p className="auth-switch">
          Already registered? <Link to="/login">Log in</Link>
        </p>

      </div>
    </section>
  );
}
