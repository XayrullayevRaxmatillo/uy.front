import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Heart, Menu, X, LayoutDashboard, MessageSquare, ShieldCheck, LogOut, ChevronDown, Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export function Logo() {
  return (
    <Link to="/" className="logo">
      <span className="logo-mark" aria-hidden="true">
        <svg viewBox="0 0 32 32">
          <path d="M5 16 16 6l11 10v10a1.5 1.5 0 0 1-1.5 1.5H20v-7h-8v7H6.5A1.5 1.5 0 0 1 5 26z" />
        </svg>
      </span>
      <span className="logo-text">
        Estate<span>Pro</span>
      </span>
    </Link>
  );
}

function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "U";
}

function Navbar() {
  const { isAuthenticated, user, isAdmin, logout, favoriteIds } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
    setMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    const onDoc = (e) => menuRef.current && !menuRef.current.contains(e.target) && setMenu(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function handleLogout() {
    logout();
    toast.info("See you soon! 👋");
    navigate("/");
  }

  const favCount = favoriteIds.size;

  return (
    <header className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="container nav-inner">
        <Logo />

        <nav className={`nav-links ${open ? "open" : ""}`}>
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/properties">Properties</NavLink>
          {isAuthenticated && <NavLink to="/dashboard">My listings</NavLink>}
          {isAdmin && <NavLink to="/admin">Admin</NavLink>}

          {!isAuthenticated ? (
            <div className="nav-auth">
              <NavLink to="/login">Login</NavLink>
              <NavLink to="/register" className="nav-button">
                Get Started
              </NavLink>
            </div>
          ) : (
            <div className="nav-auth mobile-only">
              <NavLink to="/favorites">Favorites</NavLink>
              <NavLink to="/inquiries">Inquiries</NavLink>
              <button className="link-like" onClick={handleLogout}>
                Logout
              </button>
            </div>
          )}
        </nav>

        <div className="nav-right">
          {isAuthenticated && (
            <>
              <Link to="/favorites" className="icon-btn fav-link" aria-label="Favorites">
                <Heart size={19} />
                {favCount > 0 && (
                  <span className="count-bubble" key={favCount}>
                    {favCount}
                  </span>
                )}
              </Link>

              <div className="user-menu" ref={menuRef}>
                <button className="avatar-btn" onClick={() => setMenu((m) => !m)} aria-expanded={menu}>
                  <span className="avatar">{initials(user?.fullName)}</span>
                  <ChevronDown size={16} className={menu ? "rot" : ""} />
                </button>
                {menu && (
                  <div className="dropdown">
                    <div className="dropdown-head">
                      <strong>{user?.fullName || "Welcome!"}</strong>
                      <small>{user?.email}</small>
                    </div>
                    <Link to="/dashboard">
                      <LayoutDashboard size={16} /> Dashboard
                    </Link>
                    <Link to="/dashboard?new=1">
                      <Plus size={16} /> New listing
                    </Link>
                    <Link to="/favorites">
                      <Heart size={16} /> Favorites
                    </Link>
                    <Link to="/inquiries">
                      <MessageSquare size={16} /> My inquiries
                    </Link>
                    {isAdmin && (
                      <Link to="/admin">
                        <ShieldCheck size={16} /> Admin panel
                      </Link>
                    )}
                    <button onClick={handleLogout}>
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          <button className="icon-btn burger" onClick={() => setOpen((o) => !o)} aria-label="Menu">
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
