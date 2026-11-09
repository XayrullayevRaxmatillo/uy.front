import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ArrowRight, Sparkles, KeyRound, HeartHandshake, Home as HomeIcon, Building2, MapPin } from "lucide-react";
import PropertyCard from "../components/PropertyCard";
import { CardSkeleton, CountUp, EmptyState, ErrorState, Reveal } from "../components/ui";
import { categoriesApi, coverImage, formatPrice, getErrorMessage, propertiesApi, unwrapList } from "../services/api";
import { POPULAR_CITIES } from "../utils/constants";

const WORDS = ["love to live.", "call home.", "grow in.", "dream about."];
const CATEGORY_EMOJI = ["🏢", "🏡", "🏰", "🏬", "🛖", "🏘️", "🌇", "🏝️"];

function RotatingWord() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % WORDS.length), 2600);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="rotating">
      <span className="rotating-word" key={i}>
        {WORDS[i]}
      </span>
    </span>
  );
}

function Home() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const [properties, setProperties] = useState([]);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [propsRes, catRes] = await Promise.allSettled([
        propertiesApi.list({ page: 1, limit: 6, sort: "newest" }),
        categoriesApi.list(),
      ]);
      if (propsRes.status === "rejected") throw propsRes.reason;
      const { items, meta } = unwrapList(propsRes.value.data);
      setProperties(items);
      setTotal(meta?.total ?? items.length);
      if (catRes.status === "fulfilled") setCategories(unwrapList(catRes.value.data).items);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load properties."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Hero ichida kursor ortidan yuradigan yorug'lik
  function onHeroMove(e) {
    const el = heroRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--hx", `${e.clientX - r.left}px`);
    el.style.setProperty("--hy", `${e.clientY - r.top}px`);
  }

  function onSearch(e) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("city", search.trim());
    if (type) params.set("type", type);
    navigate(`/properties${params.toString() ? `?${params}` : ""}`);
  }

  const showcase = properties.slice(0, 2);
  const cities = [...new Set([...properties.map((p) => p.city).filter(Boolean), ...POPULAR_CITIES])];

  return (
    <>
      <section className="hero" ref={heroRef} onMouseMove={onHeroMove}>
        <div className="hero-bg" aria-hidden="true">
          <span className="blob b1" />
          <span className="blob b2" />
          <span className="blob b3" />
          <span className="hero-spot" />
          <span className="hero-grid" />
        </div>

        <div className="container hero-inner">
          <div className="hero-content">
            <span className="hero-label">
              <Sparkles size={15} /> FIND YOUR DREAM HOME
            </span>

            <h1>
              Discover a place
              <br />
              you'll <RotatingWord />
            </h1>

            <p>Explore beautiful properties and find the perfect home for your lifestyle — sunny flats, cozy houses and everything in between.</p>

            <form className="search-box" onSubmit={onSearch}>
              <Search size={20} className="search-icon" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by city — e.g. Tashkent"
                aria-label="City"
              />
              <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Listing type">
                <option value="">Buy or rent</option>
                <option value="SALE">Buy</option>
                <option value="RENT">Rent</option>
              </select>
              <button type="submit" className="btn btn-primary">
                Search
              </button>
            </form>

            <div className="hero-chips">
              {POPULAR_CITIES.slice(0, 4).map((c, i) => (
                <Link key={c} to={`/properties?city=${encodeURIComponent(c)}`} className="chip" style={{ "--delay": `${600 + i * 90}ms` }}>
                  <MapPin size={13} /> {c}
                </Link>
              ))}
            </div>

            <Link to="/properties" className="explore-link">
              Explore Properties <ArrowRight size={18} />
            </Link>
          </div>

          <div className="hero-visual" aria-hidden="true">
            <div className="hero-photo">
              <img src={showcase[0] ? coverImage(showcase[0]) : "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=900&q=70"} alt="" />
            </div>
            <div className="float-card fc-1">
              <span className="fc-emoji">🔑</span>
              <div>
                <strong>{showcase[0] ? formatPrice(showcase[0].price, showcase[0].currency) : "New keys"}</strong>
                <small>{showcase[0]?.city || "Ready to move in"}</small>
              </div>
            </div>
            <div className="float-card fc-2">
              <span className="fc-emoji">😍</span>
              <div>
                <strong>Happy movers</strong>
                <small>Every single day</small>
              </div>
            </div>
            <div className="float-card fc-3">
              <span className="pulse-dot" /> Live listings
            </div>
          </div>
        </div>

        <div className="marquee" aria-hidden="true">
          <div className="marquee-track">
            {[...cities, ...cities].map((c, i) => (
              <span key={i}>
                {c} <i>✦</i>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="container stats-row">
        {[
          { n: total, label: "Listed homes", icon: <HomeIcon size={22} /> },
          { n: categories.length, label: "Categories", icon: <Building2 size={22} /> },
          { n: cities.length, label: "Cities", icon: <MapPin size={22} /> },
          { n: 100, label: "Smiles guaranteed", icon: <HeartHandshake size={22} />, suffix: "%" },
        ].map((s, i) => (
          <Reveal className="stat" key={s.label} delay={i * 90}>
            <span className="stat-icon">{s.icon}</span>
            <strong>
              <CountUp to={s.n} suffix={s.suffix} />
            </strong>
            <small>{s.label}</small>
          </Reveal>
        ))}
      </section>

      {categories.length > 0 && (
        <section className="container section">
          <Reveal className="section-heading">
            <div>
              <span>BROWSE BY TYPE</span>
              <h2>What are you looking for?</h2>
            </div>
          </Reveal>
          <div className="category-grid">
            {categories.map((c, i) => (
              <Reveal key={c.id} delay={i * 60}>
                <Link to={`/properties?category=${c.id}`} className="category-tile">
                  <span className="cat-emoji">{CATEGORY_EMOJI[i % CATEGORY_EMOJI.length]}</span>
                  <strong>{c.name}</strong>
                  <ArrowRight size={16} className="cat-arrow" />
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <section className="container section properties-section">
        <Reveal className="section-heading">
          <div>
            <span>OUR SELECTION</span>
            <h2>Featured Properties</h2>
          </div>
          <Link to="/properties" className="view-all">
            View All <ArrowRight size={16} />
          </Link>
        </Reveal>

        {loading ? (
          <CardSkeleton count={6} />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : properties.length === 0 ? (
          <EmptyState
            emoji="🌱"
            title="No properties available yet"
            text="Be the first to list a home — it only takes a minute."
            action={
              <Link to="/dashboard?new=1" className="btn btn-primary">
                List a property
              </Link>
            }
          />
        ) : (
          <div className="property-grid">
            {properties.map((property, i) => (
              <PropertyCard key={property.id} property={property} index={i} />
            ))}
          </div>
        )}
      </section>

      <section className="container section">
        <Reveal className="section-heading centered">
          <div>
            <span>SIMPLE AS 1-2-3</span>
            <h2>How EstatePro works</h2>
          </div>
        </Reveal>
        <div className="steps">
          {[
            { icon: <Search />, title: "Search", text: "Filter by city, price, rooms and type to find homes that fit you." },
            { icon: <HeartHandshake />, title: "Save & ask", text: "Tap the heart to save favorites and message sellers in one click." },
            { icon: <KeyRound />, title: "Move in", text: "Agree with the seller and get the keys to your new happy place." },
          ].map((s, i) => (
            <Reveal className="step" key={s.title} delay={i * 120}>
              <span className="step-num">{i + 1}</span>
              <span className="step-icon">{s.icon}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container section">
        <Reveal className="cta">
          <div className="cta-bubbles" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </div>
          <div>
            <h2>Have a home to sell or rent?</h2>
            <p>List it for free. Our team reviews every listing so buyers can trust what they see.</p>
          </div>
          <Link to="/dashboard?new=1" className="btn btn-light">
            List your property <ArrowRight size={18} />
          </Link>
        </Reveal>
      </section>
    </>
  );
}

export default Home;
