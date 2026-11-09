import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PropertyCard from "../components/PropertyCard";
import { CardSkeleton, EmptyState, ErrorState, Reveal } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { getErrorMessage } from "../services/api";

function Favorites() {
  const { loadFavorites, favoriteIds } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const list = await loadFavorites();
      // Javob: [{ propertyId, property }] yoki to'g'ridan-to'g'ri property'lar
      setItems(list.map((f) => f.property || f).filter((p) => p && p.title));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Yurakcha bosilganda ro'yxatdan darhol yo'qoladi
  const visible = items.filter((p) => favoriteIds.has(String(p.id)));

  return (
    <section className="container section">
      <Reveal className="page-hero">
        <span className="eyebrow">YOUR COLLECTION</span>
        <h1>
          Favorites <span className="beat-emoji">❤️</span>
        </h1>
        <p>Homes you loved, all in one cozy place.</p>
      </Reveal>

      {loading ? (
        <CardSkeleton count={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : visible.length === 0 ? (
        <EmptyState
          emoji="💌"
          title="No favorites yet"
          text="Tap the heart on any home you like and it'll show up here."
          action={
            <Link to="/properties" className="btn btn-primary">
              Find homes to love
            </Link>
          }
        />
      ) : (
        <div className="property-grid">
          {visible.map((p, i) => (
            <PropertyCard key={p.id} property={p} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}

export default Favorites;
