import { useRef } from "react";
import { Link } from "react-router-dom";
import { MapPin, BedDouble, Bath, Maximize, ArrowUpRight } from "lucide-react";
import FavoriteButton from "./FavoriteButton";
import { StatusBadge } from "./ui";
import { coverImage, fallbackImage, formatPrice } from "../services/api";

function PropertyCard({ property, showStatus = false, actions, index = 0 }) {
  const ref = useRef(null);
  const isRent = property.listingType === "RENT";

  // Sichqoncha bilan yengil 3D egilish
  function onMove(e) {
    const el = ref.current;
    if (!el || window.matchMedia("(hover: none)").matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    el.style.setProperty("--rx", `${(-y * 5).toFixed(2)}deg`);
    el.style.setProperty("--ry", `${(x * 6).toFixed(2)}deg`);
    el.style.setProperty("--mx", `${(x + 0.5) * 100}%`);
    el.style.setProperty("--my", `${(y + 0.5) * 100}%`);
  }
  function onLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  return (
    <article
      className="property-card"
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ "--delay": `${(index % 9) * 70}ms` }}
    >
      <Link to={`/properties/${property.id}`} className="card-media">
        <img
          src={coverImage(property)}
          alt={property.title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = fallbackImage(property.id);
          }}
        />
        <span className={`property-type ${isRent ? "rent" : "sale"}`}>{isRent ? "For Rent" : "For Sale"}</span>
        {showStatus && (
          <span className="card-status">
            <StatusBadge status={property.status} />
          </span>
        )}
        <span className="card-shine" aria-hidden="true" />
      </Link>

      <FavoriteButton propertyId={property.id} className="card-fav" />

      <div className="property-info">
        {property.category?.name && <span className="card-category">{property.category.name}</span>}
        <h3>
          <Link to={`/properties/${property.id}`}>{property.title}</Link>
        </h3>

        <p className="location">
          <MapPin size={15} />
          {[property.address, property.city].filter(Boolean).join(", ")}
        </p>

        <div className="property-features">
          <span>
            <BedDouble size={15} /> {property.rooms ?? "—"} {property.rooms === 1 ? "room" : "rooms"}
          </span>
          <span>
            <Bath size={15} /> {property.bathrooms ?? "—"} {property.bathrooms === 1 ? "bath" : "baths"}
          </span>
          <span>
            <Maximize size={15} /> {property.area ?? "—"} m²
          </span>
        </div>

        <div className="property-bottom">
          <div className="price">
            {formatPrice(property.price, property.currency)}
            {isRent && <small>/month</small>}
          </div>
          {actions || (
            <Link to={`/properties/${property.id}`} className="details-link" aria-label="View details">
              <ArrowUpRight size={18} />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

export default PropertyCard;
