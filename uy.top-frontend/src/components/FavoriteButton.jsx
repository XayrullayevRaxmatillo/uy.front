import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../services/api";

// Yurakcha: POST/DELETE /favorites/:propertyId — bosilganda "portlash" animatsiyasi
function FavoriteButton({ propertyId, withLabel = false, className = "" }) {
  const { isAuthenticated, favoriteIds, toggleFavorite } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [burst, setBurst] = useState(0);
  const active = favoriteIds.has(String(propertyId));

  async function onClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info("Log in to save homes you love 💛");
      navigate("/login", { state: { from: window.location.pathname } });
      return;
    }
    if (!active) setBurst((b) => b + 1);
    try {
      const nowActive = await toggleFavorite(propertyId);
      toast.success(nowActive ? "Saved to favorites ❤️" : "Removed from favorites");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not update favorites."));
    }
  }

  return (
    <button
      type="button"
      className={`fav-btn ${active ? "active" : ""} ${withLabel ? "with-label" : ""} ${className}`}
      onClick={onClick}
      aria-pressed={active}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
    >
      <span className="fav-icon">
        <Heart size={withLabel ? 18 : 19} />
        {burst > 0 && (
          <span className="burst" key={burst} aria-hidden="true">
            {Array.from({ length: 8 }).map((_, i) => (
              <i key={i} style={{ "--a": `${i * 45}deg` }} />
            ))}
          </span>
        )}
      </span>
      {withLabel && <span>{active ? "Saved" : "Add to Favorites"}</span>}
    </button>
  );
}

export default FavoriteButton;
