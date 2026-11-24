import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <span>© {new Date().getFullYear()} Where is my Train. Demo app.</span>
      <div><Link to="/about">About</Link><Link to="/contact">Contact</Link></div>
    </footer>
  );
}