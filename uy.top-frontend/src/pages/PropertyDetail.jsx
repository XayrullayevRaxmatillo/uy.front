import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin, BedDouble, Bath, Maximize, ChevronLeft, ChevronRight, Send, Phone, User, Tag, CalendarDays, LogIn } from "lucide-react";
import FavoriteButton from "../components/FavoriteButton";
import { FieldError, NotFound, Reveal, Spinner, StatusBadge, ErrorState } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { fallbackImage, formatDate, formatPrice, getErrorMessage, getFieldErrors, imageUrl, inquiriesApi, propertiesApi, sortedImages } from "../services/api";
import { PHONE_RE } from "../utils/constants";
import { confetti } from "../utils/confetti";

function Gallery({ property }) {
  const imgs = sortedImages(property).map(imageUrl).filter(Boolean);
  const list = imgs.length ? imgs : [fallbackImage(property.id)];
  const [i, setI] = useState(0);
  const go = (d) => setI((x) => (x + d + list.length) % list.length);

  return (
    <div className="gallery">
      <div className="gallery-main">
        <img key={i} src={list[i]} alt={property.title} onError={(e) => (e.currentTarget.src = fallbackImage(property.id))} />
        {list.length > 1 && (
          <>
            <button className="gal-nav left" onClick={() => go(-1)} aria-label="Previous photo">
              <ChevronLeft />
            </button>
            <button className="gal-nav right" onClick={() => go(1)} aria-label="Next photo">
              <ChevronRight />
            </button>
            <span className="gal-count">
              {i + 1} / {list.length}
            </span>
          </>
        )}
      </div>
      {list.length > 1 && (
        <div className="gallery-thumbs">
          {list.map((src, idx) => (
            <button key={src + idx} className={idx === i ? "on" : ""} onClick={() => setI(idx)}>
              <img src={src} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyDetail() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null); // 404 | error
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({ phone: "", message: "" });
  const [errors, setErrors] = useState({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function load() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await propertiesApi.get(id);
      setProperty(res.data?.data || res.data);
    } catch (err) {
      const code = err.response?.status;
      setStatus(code === 404 || code === 400 ? 404 : "error");
      setErrorMsg(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (user?.phone) setForm((f) => (f.phone ? f : { ...f, phone: user.phone }));
  }, [user]);

  function validate() {
    const e = {};
    if (!PHONE_RE.test(form.phone.trim())) e.phone = "Enter a valid phone number, e.g. +998 90 123 45 67";
    const len = form.message.trim().length;
    if (len < 10) e.message = "Message should be at least 10 characters.";
    if (len > 1000) e.message = "Message should be at most 1000 characters.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function sendInquiry(e) {
    e.preventDefault();
    if (!validate()) return;
    setSending(true);
    try {
      await inquiriesApi.send(id, { message: form.message.trim(), phone: form.phone.trim() });
      setSent(true);
      setForm((f) => ({ ...f, message: "" }));
      toast.success("Your inquiry has been sent! 📬");
      confetti({ x: 0.75, y: 0.4, count: 90 });
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err, "Failed to send inquiry."));
    } finally {
      setSending(false);
    }
  }

  if (loading) return <Spinner label="Unlocking the front door..." />;
  if (status === 404) return <NotFound title="Property not found" text="This listing may have been removed or is still under review." />;
  if (status === "error")
    return (
      <div className="container section">
        <ErrorState message={errorMsg} onRetry={load} />
      </div>
    );
  if (!property) return null;

  const owner = property.user || property.owner || property.seller;
  const ownerId = property.userId ?? property.ownerId ?? owner?.id;
  const isOwner = user && ownerId != null && String(ownerId) === String(user.id);
  const isRent = property.listingType === "RENT";

  return (
    <section className="container section detail-page">
      <Link to="/properties" className="back-link">
        <ChevronLeft size={16} /> Back to properties
      </Link>

      <div className="detail-grid">
        <div className="detail-left">
          <Reveal>
            <Gallery property={property} />
          </Reveal>

          <Reveal className="detail-head" delay={80}>
            <div className="tag-row">
              <span className={`property-type static ${isRent ? "rent" : "sale"}`}>{isRent ? "For Rent" : "For Sale"}</span>
              {property.category?.name && (
                <span className="soft-tag">
                  <Tag size={13} /> {property.category.name}
                </span>
              )}
              {property.status && property.status !== "APPROVED" && <StatusBadge status={property.status} />}
            </div>
            <h1>{property.title}</h1>
            <p className="location">
              <MapPin size={17} /> {[property.address, property.city].filter(Boolean).join(", ")}
            </p>
          </Reveal>

          <Reveal className="feature-tiles" delay={140}>
            <div>
              <BedDouble />
              <strong>{property.rooms}</strong>
              <small>Rooms</small>
            </div>
            <div>
              <Bath />
              <strong>{property.bathrooms}</strong>
              <small>Bathrooms</small>
            </div>
            <div>
              <Maximize />
              <strong>{property.area} m²</strong>
              <small>Area</small>
            </div>
          </Reveal>

          <Reveal className="detail-section" delay={180}>
            <h3>Description</h3>
            <p className="description">{property.description}</p>
          </Reveal>
        </div>

        <aside className="detail-right">
          <div className="price-card">
            <small>{isRent ? "Monthly rent" : "Price"}</small>
            <div className="big-price">{formatPrice(property.price, property.currency)}</div>
            <FavoriteButton propertyId={property.id} withLabel className="favorite-button" />
            {property.createdAt && (
              <p className="muted small">
                <CalendarDays size={14} /> Listed {formatDate(property.createdAt)}
              </p>
            )}
          </div>

          {owner && (
            <div className="seller-card">
              <span className="avatar lg">{(owner.fullName || "S")[0]}</span>
              <div>
                <small>Listed by</small>
                <strong>{owner.fullName || "Seller"}</strong>
                {owner.phone && (
                  <a href={`tel:${owner.phone}`} className="muted small">
                    <Phone size={13} /> {owner.phone}
                  </a>
                )}
              </div>
            </div>
          )}

          {isOwner ? (
            <div className="inquiry-form owner-note">
              <h3>This is your listing 🎉</h3>
              <p>Buyers will contact you from here. Manage it from your dashboard.</p>
              <Link to="/dashboard" className="btn btn-primary full">
                Go to dashboard
              </Link>
            </div>
          ) : !isAuthenticated ? (
            <div className="inquiry-form owner-note">
              <h3>Interested? 👋</h3>
              <p>Log in to contact the seller and ask anything about this home.</p>
              <Link to="/login" state={{ from: `/properties/${id}` }} className="btn btn-primary full">
                <LogIn size={17} /> Login to contact
              </Link>
            </div>
          ) : sent ? (
            <div className="inquiry-form sent-card">
              <div className="sent-emoji">📬</div>
              <h3>Message delivered!</h3>
              <p>The seller will get back to you soon. You can track it in your inquiries.</p>
              <div className="row-center">
                <Link to="/inquiries" className="btn btn-primary">
                  My inquiries
                </Link>
                <button className="btn btn-ghost" onClick={() => setSent(false)}>
                  Send another
                </button>
              </div>
            </div>
          ) : (
            <form className="inquiry-form" onSubmit={sendInquiry} noValidate>
              <h3>Contact Seller</h3>
              <label>Your phone</label>
              <div className="input-icon">
                <Phone size={16} />
                <input
                  placeholder="+998 90 123 45 67"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={errors.phone ? "invalid" : ""}
                />
              </div>
              <FieldError>{errors.phone}</FieldError>

              <label>Message</label>
              <textarea
                placeholder="Hi! Is this home still available? I'd love to visit this week."
                value={form.message}
                maxLength={1000}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className={errors.message ? "invalid" : ""}
              />
              <div className="row-between">
                <FieldError>{errors.message}</FieldError>
                <small className="muted">{form.message.length}/1000</small>
              </div>

              <button type="submit" className="btn btn-primary full" disabled={sending}>
                {sending ? "Sending..." : (
                  <>
                    <Send size={16} /> Send Inquiry
                  </>
                )}
              </button>
              <p className="muted small center">
                <User size={13} /> Sent as {user?.fullName}
              </p>
            </form>
          )}
        </aside>
      </div>
    </section>
  );
}

export default PropertyDetail;
