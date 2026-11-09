import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { STATUSES } from "../utils/constants";

/* Scroll qilganda paydo bo'ladigan blok */
export function Reveal({ as: Tag = "div", delay = 0, className = "", children, ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!("IntersectionObserver" in window)) {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${shown ? "is-visible" : ""} ${className}`}
      style={{ "--delay": `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* Raqam 0 dan sanab chiqadi */
export function CountUp({ to = 0, duration = 1400, suffix = "" }) {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const step = (t) => {
        const p = Math.min(1, (t - start) / duration);
        setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to, duration]);
  return (
    <span ref={ref}>
      {n.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}

export function StatusBadge({ status }) {
  const s = STATUSES[status] || { label: status || "Unknown", emoji: "•" };
  return (
    <span className={`status-badge status-${String(status || "").toLowerCase()}`}>
      <i className="dot" />
      {s.label}
    </span>
  );
}

export function Spinner({ label }) {
  return (
    <div className="spinner-wrap">
      <div className="house-loader" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      {label && <p>{label}</p>}
    </div>
  );
}

export function CardSkeleton({ count = 6 }) {
  return (
    <div className="property-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="property-card skeleton-card" key={i} style={{ "--delay": `${i * 80}ms` }}>
          <div className="sk sk-img" />
          <div className="property-info">
            <div className="sk sk-line w40" />
            <div className="sk sk-line w80" />
            <div className="sk sk-line w60" />
            <div className="sk sk-line w100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ emoji = "🏡", title, text, action }) {
  return (
    <div className="empty-state">
      <div className="empty-emoji">{emoji}</div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="empty-state error-state">
      <div className="empty-emoji">🛠️</div>
      <h3>Oops, something went sideways</h3>
      <p>{message}</p>
      {onRetry && (
        <button className="btn btn-primary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ open, title, text, confirmLabel = "Delete", onConfirm, onClose, busy }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="confirm-body">
        <div className="confirm-emoji">🤔</div>
        <p>{text}</p>
        <div className="row-end">
          <button className="btn btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function FieldError({ children }) {
  if (!children) return null;
  return <small className="field-error">{children}</small>;
}

export function NotFound({ title = "This page wandered off", text = "We couldn't find what you were looking for." }) {
  return (
    <section className="center-page">
      <div className="big-404">
        4<span className="spin-house">🏠</span>4
      </div>
      <h1>{title}</h1>
      <p>{text}</p>
      <Link to="/" className="btn btn-primary">
        Take me home
      </Link>
    </section>
  );
}

export function Forbidden() {
  return (
    <section className="center-page">
      <div className="big-404">🔒</div>
      <h1>Access denied</h1>
      <p>This area is for administrators only.</p>
      <Link to="/" className="btn btn-primary">
        Back to home
      </Link>
    </section>
  );
}
