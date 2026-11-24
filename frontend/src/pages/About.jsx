export default function About() {
  return <section className="page narrow-page">
    <p className="eyebrow">ABOUT THE PROJECT</p>
    <h1>Where is my Train</h1>
    <p className="lead">A simple train information and ticket-booking workflow demonstration.</p>
    <div className="content-card">
      <h2>What you can do</h2>
      <ul className="feature-list">
        <li>Search trains by number, name, or route.</li>
        <li>View sample train status, station, platform and delay details.</li>
        <li>Create a demo account and sign in.</li>
        <li>Run a four-step booking simulation using async/await.</li>
      </ul>
      <p className="muted">This version uses sample data. It is not connected to live Indian Railways services, real seat inventory, or a payment gateway.</p>
    </div>
  </section>;
}