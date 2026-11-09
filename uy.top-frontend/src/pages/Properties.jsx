import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, ChevronLeft, ChevronRight, Search } from "lucide-react";
import PropertyCard from "../components/PropertyCard";
import { CardSkeleton, EmptyState, ErrorState, Reveal } from "../components/ui";
import { categoriesApi, getErrorMessage, propertiesApi, unwrapList } from "../services/api";
import { LISTING_TYPES, SORTS } from "../utils/constants";

const LIMIT = 9;
const FILTER_KEYS = ["city", "category", "type", "minPrice", "maxPrice", "rooms", "sort"];

// Filter URL query string'ida saqlanadi — sahifa yangilansa ham yo'qolmaydi
function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = useState([]);
  const [properties, setProperties] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [cityDraft, setCityDraft] = useState(searchParams.get("city") || "");

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const filters = useMemo(() => {
    const f = {};
    FILTER_KEYS.forEach((k) => {
      const v = searchParams.get(k);
      if (v) f[k] = v;
    });
    return f;
  }, [searchParams]);

  const priceError =
    filters.minPrice && filters.maxPrice && Number(filters.minPrice) > Number(filters.maxPrice)
      ? "Min price can't be bigger than max price."
      : "";

  function setParam(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value === "" || value == null) next.delete(key);
    else next.set(key, value);
    if (key !== "page") next.delete("page");
    setSearchParams(next, { replace: key !== "page" });
  }

  function clearAll() {
    setCityDraft("");
    setSearchParams({});
  }

  useEffect(() => {
    categoriesApi
      .list()
      .then((r) => setCategories(unwrapList(r.data).items))
      .catch(() => {});
  }, []);

  // Shahar inputi — 400ms debounce
  useEffect(() => {
    const t = setTimeout(() => {
      if ((searchParams.get("city") || "") !== cityDraft.trim()) setParam("city", cityDraft.trim());
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cityDraft]);

  async function load() {
    if (priceError) return;
    setLoading(true);
    setError("");
    try {
      const res = await propertiesApi.list({ page, limit: LIMIT, ...filters });
      const { items, meta: m } = unwrapList(res.data);
      setProperties(items);
      setMeta(m);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load properties."));
      setProperties([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const totalPages = meta?.totalPages ?? (properties.length < LIMIT ? page : page + 1);
  const activeCount = Object.keys(filters).filter((k) => k !== "sort").length;

  function goPage(p) {
    setParam("page", p === 1 ? "" : String(p));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <section className="container section properties-page">
      <Reveal className="page-hero">
        <span className="eyebrow">FIND YOUR PROPERTY</span>
        <h1>Explore Properties</h1>
        <p>
          {meta?.total != null ? (
            <>
              <strong>{meta.total}</strong> homes are waiting for you ✨
            </>
          ) : (
            "Homes picked and reviewed by our team ✨"
          )}
        </p>
      </Reveal>

      <div className="list-layout">
        <aside className={`filters ${panelOpen ? "open" : ""}`}>
          <div className="filters-head">
            <h3>
              <SlidersHorizontal size={18} /> Filters
            </h3>
            <button className="icon-btn only-mobile" onClick={() => setPanelOpen(false)} aria-label="Close filters">
              <X size={18} />
            </button>
          </div>

          <label>City</label>
          <div className="input-icon">
            <Search size={16} />
            <input placeholder="Any city" value={cityDraft} onChange={(e) => setCityDraft(e.target.value)} />
          </div>

          <label>Type</label>
          <div className="segmented">
            <button className={!filters.type ? "on" : ""} onClick={() => setParam("type", "")}>
              All
            </button>
            {LISTING_TYPES.map((t) => (
              <button key={t.value} className={filters.type === t.value ? "on" : ""} onClick={() => setParam("type", t.value)}>
                {t.value === "SALE" ? "Buy" : "Rent"}
              </button>
            ))}
          </div>

          <label>Category</label>
          <select value={filters.category || ""} onChange={(e) => setParam("category", e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <label>Price range</label>
          <div className="two-col">
            <input type="number" min="0" placeholder="Min" value={filters.minPrice || ""} onChange={(e) => setParam("minPrice", e.target.value)} />
            <input type="number" min="0" placeholder="Max" value={filters.maxPrice || ""} onChange={(e) => setParam("maxPrice", e.target.value)} />
          </div>
          {priceError && <small className="field-error">{priceError}</small>}

          <label>Rooms</label>
          <div className="room-pills">
            {["", "1", "2", "3", "4", "5"].map((r) => (
              <button key={r || "any"} className={(filters.rooms || "") === r ? "on" : ""} onClick={() => setParam("rooms", r)}>
                {r || "Any"}
                {r === "5" && "+"}
              </button>
            ))}
          </div>

          {activeCount > 0 && (
            <button className="btn btn-ghost full" onClick={clearAll}>
              Clear all filters
            </button>
          )}
        </aside>
        {panelOpen && <div className="filters-overlay" onClick={() => setPanelOpen(false)} />}

        <div className="list-main">
          <div className="list-toolbar">
            <button className="btn btn-ghost only-mobile" onClick={() => setPanelOpen(true)}>
              <SlidersHorizontal size={16} /> Filters {activeCount > 0 && <span className="mini-count">{activeCount}</span>}
            </button>
            <div className="active-chips">
              {Object.entries(filters)
                .filter(([k]) => k !== "sort")
                .map(([k, v]) => (
                  <button key={k} className="chip removable" onClick={() => (k === "city" ? setCityDraft("") : setParam(k, ""))}>
                    {k === "category" ? categories.find((c) => String(c.id) === v)?.name || v : k === "type" ? (v === "RENT" ? "Rent" : "Sale") : `${k}: ${v}`}
                    <X size={13} />
                  </button>
                ))}
            </div>
            <select className="sort-select" value={filters.sort || "newest"} onChange={(e) => setParam("sort", e.target.value)}>
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {priceError ? (
            <EmptyState emoji="🧮" title="Check the price range" text={priceError} />
          ) : loading ? (
            <CardSkeleton count={6} />
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : properties.length === 0 ? (
            <EmptyState
              emoji="🔍"
              title="No properties found"
              text="Try widening your filters — your dream home might be just around the corner."
              action={
                activeCount > 0 && (
                  <button className="btn btn-primary" onClick={clearAll}>
                    Reset filters
                  </button>
                )
              }
            />
          ) : (
            <div className="property-grid grid-2">
              {properties.map((p, i) => (
                <PropertyCard key={p.id} property={p} index={i} />
              ))}
            </div>
          )}

          {!loading && !error && properties.length > 0 && totalPages > 1 && (
            <div className="pagination">
              <button className="btn btn-ghost" disabled={page <= 1} onClick={() => goPage(page - 1)}>
                <ChevronLeft size={16} /> Previous
              </button>
              <div className="page-dots">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 3, totalPages - 6));
                  const p = start + i;
                  return (
                    <button key={p} className={p === page ? "on" : ""} onClick={() => goPage(p)}>
                      {p}
                    </button>
                  );
                })}
              </div>
              <button className="btn btn-ghost" disabled={page >= totalPages} onClick={() => goPage(page + 1)}>
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default Properties;
