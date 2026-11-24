import { useState } from 'react';

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  function submit(e) {
    e.preventDefault();
    setSent(true);
    setForm({ name: '', email: '', message: '' });
  }

  return <section className="page narrow-page">
    <p className="eyebrow">GET IN TOUCH</p><h1>Contact Us</h1>
    <p className="lead">Have feedback or questions about this demo? Send a message.</p>
    <div className="content-card">
      {sent ? <div className="success-message">Thanks! Your demo message has been submitted on this page.</div> : (
        <form className="stack-form" onSubmit={submit}>
          <label>Full name<input className="field" required value={form.name} onChange={e => setForm({...form, name:e.target.value})} /></label>
          <label>Email address<input className="field" type="email" required value={form.email} onChange={e => setForm({...form, email:e.target.value})} /></label>
          <label>Message<textarea className="field" rows="5" required value={form.message} onChange={e => setForm({...form, message:e.target.value})} /></label>
          <button className="button primary" type="submit">Send Message</button>
        </form>
      )}
    </div>
  </section>;
}