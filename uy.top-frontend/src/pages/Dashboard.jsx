import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Pencil, Trash2, Eye, LayoutGrid, UserRound, Save, Mail, Phone, ShieldCheck } from "lucide-react";
import PropertyCard from "../components/PropertyCard";
import PropertyForm from "../components/PropertyForm";
import { CardSkeleton, ConfirmDialog, CountUp, EmptyState, ErrorState, FieldError, Modal, Reveal, Spinner } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { formatDate, getErrorMessage, getFieldErrors, propertiesApi, unwrapList, usersApi } from "../services/api";
import { PHONE_RE, greeting } from "../utils/constants";
import { confetti } from "../utils/confetti";

function Listings() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [editing, setEditing] = useState(null); // null | {} (new) | property
  const [loadingEdit, setLoadingEdit] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await propertiesApi.mine();
      setItems(unwrapList(res.data).items);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load your listings."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Navbar'dagi "New listing" -> /dashboard?new=1
  useEffect(() => {
    if (searchParams.get("new")) {
      setEditing({});
      const next = new URLSearchParams(searchParams);
      next.delete("new");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  async function openEdit(p) {
    setLoadingEdit(true);
    try {
      const res = await propertiesApi.get(p.id);
      setEditing(res.data?.data || res.data);
    } catch {
      setEditing(p);
    } finally {
      setLoadingEdit(false);
    }
  }

  function onSaved(saved, isEdit) {
    setEditing(null);
    if (isEdit) toast.success("Listing updated ✨");
    else {
      confetti();
      toast.success("Listing created! It's now waiting for admin review ⏳");
    }
    load();
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await propertiesApi.remove(toDelete.id);
      setItems((x) => x.filter((i) => i.id !== toDelete.id));
      toast.success("Listing deleted");
      setToDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete."));
    } finally {
      setDeleting(false);
    }
  }

  const counts = items.reduce(
    (acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    },
    { PENDING: 0, APPROVED: 0, REJECTED: 0 }
  );
  const visible = filter === "ALL" ? items : items.filter((p) => p.status === filter);

  return (
    <>
      <div className="dash-stats">
        {[
          { key: "ALL", label: "All listings", n: items.length, cls: "all" },
          { key: "APPROVED", label: "Approved", n: counts.APPROVED, cls: "approved" },
          { key: "PENDING", label: "Pending", n: counts.PENDING, cls: "pending" },
          { key: "REJECTED", label: "Rejected", n: counts.REJECTED, cls: "rejected" },
        ].map((s, i) => (
          <Reveal key={s.key} delay={i * 70}>
            <button className={`dash-stat ${s.cls} ${filter === s.key ? "on" : ""}`} onClick={() => setFilter(s.key)}>
              <strong>
                <CountUp to={s.n} duration={800} />
              </strong>
              <small>{s.label}</small>
            </button>
          </Reveal>
        ))}
      </div>

      {loading ? (
        <CardSkeleton count={3} />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : visible.length === 0 ? (
        <EmptyState
          emoji={filter === "ALL" ? "🪴" : "🗂️"}
          title={filter === "ALL" ? "You haven't listed anything yet" : "Nothing here"}
          text={filter === "ALL" ? "Add your first property — buyers are looking right now!" : "No listings with this status."}
          action={
            filter === "ALL" && (
              <button className="btn btn-primary" onClick={() => setEditing({})}>
                <Plus size={17} /> Create first listing
              </button>
            )
          }
        />
      ) : (
        <div className="property-grid">
          {visible.map((p, i) => (
            <PropertyCard
              key={p.id}
              property={p}
              index={i}
              showStatus
              actions={
                <div className="card-actions">
                  <Link to={`/properties/${p.id}`} className="icon-btn" title="View">
                    <Eye size={16} />
                  </Link>
                  <button className="icon-btn" title="Edit" onClick={() => openEdit(p)} disabled={loadingEdit}>
                    <Pencil size={16} />
                  </button>
                  <button className="icon-btn danger" title="Delete" onClick={() => setToDelete(p)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              }
            />
          ))}
        </div>
      )}

      <button className="fab" onClick={() => setEditing({})} aria-label="New listing">
        <Plus size={24} />
      </button>

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing?.id ? "Edit listing" : "New listing 🏡"} wide>
        {editing !== null && <PropertyForm initial={editing} onSaved={onSaved} onCancel={() => setEditing(null)} />}
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete listing?"
        text={`"${toDelete?.title}" will be removed permanently.`}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
        busy={deleting}
      />
    </>
  );
}

function Profile() {
  const { setUser } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ fullName: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    usersApi
      .me()
      .then((r) => {
        const u = r.data?.user || r.data;
        setProfile(u);
        setForm({ fullName: u.fullName || "", phone: u.phone || "" });
      })
      .catch((err) => toast.error(getErrorMessage(err)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(e) {
    e.preventDefault();
    const v = {};
    const n = form.fullName.trim();
    if (n && (n.length < 2 || n.length > 100)) v.fullName = "Full name must be 2–100 characters.";
    if (form.phone.trim() && !PHONE_RE.test(form.phone.trim())) v.phone = "Phone format looks wrong.";
    setErrors(v);
    if (Object.keys(v).length) return;
    setSaving(true);
    try {
      const body = {};
      if (n) body.fullName = n;
      if (form.phone.trim()) body.phone = form.phone.trim();
      const res = await usersApi.update(body);
      const u = res.data?.user || res.data;
      setProfile(u);
      setUser((old) => ({ ...old, ...u }));
      toast.success("Profile saved 🙌");
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err, "Could not save profile."));
    } finally {
      setSaving(false);
    }
  }

  if (!profile) return <Spinner />;

  return (
    <Reveal className="profile-card">
      <div className="profile-top">
        <span className="avatar xl">{(profile.fullName || "U")[0]}</span>
        <div>
          <h3>{profile.fullName}</h3>
          <p className="muted">
            <Mail size={14} /> {profile.email}
          </p>
          <p className="muted small">
            {profile.role === "ADMIN" && (
              <span className="soft-tag">
                <ShieldCheck size={13} /> Admin
              </span>
            )}{" "}
            Member since {formatDate(profile.createdAt) || "—"}
          </p>
        </div>
      </div>
      <form onSubmit={save} noValidate className="form-grid">
        <div className="field">
          <label>Full name</label>
          <div className="input-icon">
            <UserRound size={16} />
            <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={errors.fullName ? "invalid" : ""} />
          </div>
          <FieldError>{errors.fullName}</FieldError>
        </div>
        <div className="field">
          <label>Phone</label>
          <div className="input-icon">
            <Phone size={16} />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+998 90 123 45 67" className={errors.phone ? "invalid" : ""} />
          </div>
          <FieldError>{errors.phone}</FieldError>
        </div>
        <div className="field wide row-end">
          <button className="btn btn-primary" disabled={saving}>
            <Save size={16} /> {saving ? "Saving..." : "Save profile"}
          </button>
        </div>
      </form>
    </Reveal>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState("listings");
  const g = greeting();

  return (
    <section className="container section dashboard">
      <Reveal className="dash-hero">
        <div>
          <span className="eyebrow">SELLER DASHBOARD</span>
          <h1>
            {g.text}, {user?.fullName?.split(" ")[0] || "friend"} <span className="wave">{g.emoji}</span>
          </h1>
          <p className="muted">Manage your listings and keep your profile fresh.</p>
        </div>
        <div className="tabs">
          <button className={tab === "listings" ? "on" : ""} onClick={() => setTab("listings")}>
            <LayoutGrid size={16} /> My listings
          </button>
          <button className={tab === "profile" ? "on" : ""} onClick={() => setTab("profile")}>
            <UserRound size={16} /> Profile
          </button>
        </div>
      </Reveal>

      {tab === "listings" ? <Listings /> : <Profile />}
    </section>
  );
}

export default Dashboard;
