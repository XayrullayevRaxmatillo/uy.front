import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Phone, CalendarDays, ArrowUpRight } from "lucide-react";
import { EmptyState, ErrorState, Reveal, Spinner } from "../components/ui";
import { coverImage, formatDate, formatPrice, getErrorMessage, inquiriesApi, unwrapList } from "../services/api";

function Inquiries() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await inquiriesApi.mine();
      setItems(unwrapList(res.data).items);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load inquiries."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section className="container section narrow">
      <Reveal className="page-hero">
        <span className="eyebrow">MESSAGES</span>
        <h1>My Inquiries</h1>
        <p>Every message you've sent to sellers.</p>
      </Reveal>

      {loading ? (
        <Spinner label="Fetching your messages..." />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyState
          emoji="✉️"
          title="No inquiries yet"
          text="Found a home you like? Send the seller a message from its page."
          action={
            <Link to="/properties" className="btn btn-primary">
              Browse properties
            </Link>
          }
        />
      ) : (
        <div className="inquiry-list">
          {items.map((q, i) => {
            const p = q.property;
            const pid = q.propertyId ?? p?.id;
            return (
              <Reveal className="inquiry-item" key={q.id ?? i} delay={i * 60}>
                {p && <img src={coverImage(p)} alt="" />}
                <div className="inquiry-body">
                  <div className="row-between">
                    <h3>{p?.title || `Property #${pid}`}</h3>
                    {p?.price != null && <span className="price small">{formatPrice(p.price, p.currency)}</span>}
                  </div>
                  <p className="bubble">
                    <MessageSquare size={15} /> {q.message}
                  </p>
                  <div className="meta-row">
                    <span>
                      <Phone size={13} /> {q.phone}
                    </span>
                    {q.createdAt && (
                      <span>
                        <CalendarDays size={13} /> {formatDate(q.createdAt)}
                      </span>
                    )}
                    {pid != null && (
                      <Link to={`/properties/${pid}`}>
                        Open listing <ArrowUpRight size={13} />
                      </Link>
                    )}
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default Inquiries;
