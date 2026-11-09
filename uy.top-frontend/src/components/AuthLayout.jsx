// Login/Register uchun umumiy ikki ustunli layout (chapda animatsion illyustratsiya)
function AuthLayout({ title, subtitle, children, side }) {
  return (
    <section className="auth-page">
      <div className="auth-art" aria-hidden="true">
        <div className="auth-art-inner">
          <div className="sun" />
          <div className="cloud c1" />
          <div className="cloud c2" />
          <svg className="house-illus" viewBox="0 0 220 180">
            <rect x="40" y="80" width="140" height="90" rx="8" className="h-wall" />
            <path d="M28 88 110 24l82 64" className="h-roof" />
            <rect x="92" y="118" width="36" height="52" rx="4" className="h-door" />
            <circle cx="120" cy="146" r="2.6" className="h-knob" />
            <rect x="56" y="100" width="26" height="24" rx="4" className="h-win w1" />
            <rect x="138" y="100" width="26" height="24" rx="4" className="h-win w2" />
            <rect x="140" y="36" width="16" height="30" rx="2" className="h-chim" />
          </svg>
          <span className="smoke s1" />
          <span className="smoke s2" />
          <span className="smoke s3" />
          <div className="auth-quote">{side}</div>
        </div>
      </div>

      <div className="auth-side">
        <div className="auth-card">
          <h1>{title}</h1>
          <p className="muted">{subtitle}</p>
          {children}
        </div>
      </div>
    </section>
  );
}

export default AuthLayout;
