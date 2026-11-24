import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="page landing-page">
      <section className="hero">
        <p className="eyebrow">YOUR JOURNEY STARTS HERE</p>
        <h1>Find Your Train.<br /><span>Plan Your Journey.</span></h1>
        <p className="hero-copy">A simple place to explore train schedules, check train status and continue your ticket-booking demo.</p>
        <div className="hero-actions">
          {user ? <Link className="button primary" to="/dashboard">Open Dashboard</Link> : <><Link className="button primary" to="/signup">Get Started</Link><Link className="button secondary" to="/login">Sign In</Link></>}
        </div>
      </section>
      <section className="landing-features">
        <article className="content-card"><h3>🚆 Explore Trains</h3><p>Find train names and numbers in one dashboard.</p></article>
        <article className="content-card"><h3>🕒 Check Timetables</h3><p>Review departure, arrival, route and platform details.</p></article>
        <article className="content-card"><h3>🎫 Book Tickets</h3><p>Try the step-by-step ticket booking demonstration.</p></article>
      </section>
      <p className="data-notice">This project currently displays sample train information. It is not connected to live Indian Railways data.</p>
    </div>
  );
}
