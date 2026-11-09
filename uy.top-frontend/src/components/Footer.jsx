import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { Logo } from "./Navbar";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
          <path d="M0,40 C240,90 480,0 720,30 C960,60 1200,10 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </div>
      <div className="container footer-grid">
        <div>
          <Logo />
          <p>Find your perfect place to live.</p>
          <p className="footer-love">
            Made with <Heart size={14} className="beat" /> for happy homes.
          </p>
        </div>
        <div>
          <h4>Explore</h4>
          <Link to="/properties?type=SALE">Homes for sale</Link>
          <Link to="/properties?type=RENT">Homes for rent</Link>
          <Link to="/properties?sort=price_asc">Best prices</Link>
        </div>
        <div>
          <h4>Account</h4>
          <Link to="/dashboard">My listings</Link>
          <Link to="/favorites">Favorites</Link>
          <Link to="/inquiries">Inquiries</Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} EstatePro. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
