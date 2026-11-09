import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, X, ShieldCheck, Users, Tags, ClipboardList, Pencil, Trash2, Plus, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { ConfirmDialog, EmptyState, ErrorState, FieldError, Reveal, Spinner, StatusBadge } from "../components/ui";
import { useToast } from "../context/ToastContext";
import { adminApi, categoriesApi, coverImage, formatDate, formatPrice, getErrorMessage, getFieldErrors, unwrapList } from "../services/api";
import { SLUG_RE, slugify } from "../utils/constants";

/* ---------- Moderatsiya: GET /admin/properties?status=..., PATCH /admin/properties/:id/status ---------- */
function Moderation() {
  const toast = useToast();
  const [status, setStatus] = useState("PENDING");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [leaving, setLeaving] = useState({});

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.properties({ status: status || undefined, page, limit: 10 });
      const { items: list, meta: m } = unwrapList(res.data);
      setItems(list);
      setMeta(m);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, page]);

  async function decide(p, next) {
    setLeaving((l) => ({ ...l, [p.id]: next }));
    try {
      await adminApi.setStatus(p.id, next);
      toast.success(next === "APPROVED" ? `"${p.title}" is now live 🎉` : `"${p.title}" was rejected`);
      setTimeout(() => {
        setItems((x) => (status ? x.filter((i) => i.id !== p.id) : x.map((i) => (i.id === p.id ? { ...i, status: next } : i))));
        setLeaving((l) => {
          const c = { ...l };
          delete c[p.id];
          return c;
        });
      }, 420);
    } catch (err) {
      setLeaving((l) => {
        const c = { ...l };
        delete c[p.id];
        return c;
      });
      toast.error(getErrorMessage(err, "Could not update status."));
    }
  }

  const totalPages = meta?.totalPages ?? 1;

  return (
    <>
      <div className="segmented wide-seg">
        {[
          ["PENDING", "⏳ Pending"],
          ["APPROVED", "✅ Approved"],
          ["REJECTED", "✖️ Rejected"],
          ["", "All"],
        ].map(([v, l]) => (
          <button
            key={v || "all"}
            className={status === v ? "on" : ""}
            onClick={() => {
              setStatus(v);
              setPage(1);
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : items.length === 0 ? (
        <EmptyState emoji="🧘" title="All clear!" text={status === "PENDING" ? "No listings waiting for review. Enjoy a coffee ☕" : "Nothing to show here."} />
      ) : (
        <div className="mod-list">
          {items.map((p, i) => (
            <Reveal key={p.id} delay={i * 50} className={`mod-item ${leaving[p.id] ? `leaving ${leaving[p.id].toLowerCase()}` : ""}`}>
              <img src={coverImage(p)} alt="" />
              <div className="mod-body">
                <div className="row-between">
                  <Link to={`/properties/${p.id}`} className="mod-title">
                    {p.title}
                  </Link>
                  <StatusBadge status={p.status} />
                </div>
                <p className="muted small">
                  <MapPin size={13} /> {[p.address, p.city].filter(Boolean).join(", ")} · {p.listingType} · {p.rooms} rooms · {p.area} m²
                </p>
                <p className="muted small">
                  By {p.user?.fullName || p.owner?.fullName || `user #${p.userId ?? "?"}`} · {formatDate(p.createdAt)}
                </p>
                <strong className="price">{formatPrice(p.price, p.currency)}</strong>
              </div>
              <div className="mod-actions">
                <button className="btn btn-success" disabled={Boolean(leaving[p.id]) || p.status === "APPROVED"} onClick={() => decide(p, "APPROVED")}>
                  <Check size={16} /> Approve
                </button>
                <button className="btn btn-danger-soft" disabled={Boolean(leaving[p.id]) || p.status === "REJECTED"} onClick={() => decide(p, "REJECTED")}>
                  <X size={16} /> Reject
                </button>
              </div>
            </Reveal>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button className="btn btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft size={16} />
          </button>
          <span>
            Page {page} / {totalPages}
          </span>
          <button className="btn btn-ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </>
  );
}

/* ---------- Foydalanuvchilar: GET /admin/users ---------- */
function UsersTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.users();
      setItems(unwrapList(res.data).items);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  const list = items.filter((u) => `${u.fullName} ${u.email}`.toLowerCase().includes(q.toLowerCase()));

  if (loading) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <>
      <input className="table-search" placeholder="Search by name or email..." value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Phone</th>
              <th>Role</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="user-cell">
                    <span className="avatar">{(u.fullName || "U")[0]}</span>
                    <div>
                      <strong>{u.fullName}</strong>
                      <small>{u.email}</small>
                    </div>
                  </div>
                </td>
                <td>{u.phone || "—"}</td>
                <td>
                  <span className={`role-tag ${u.role === "ADMIN" ? "admin" : ""}`}>{u.role}</span>
                </td>
                <td>{formatDate(u.createdAt) || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {list.length === 0 && <EmptyState emoji="👀" title="No users match" />}
      </div>
    </>
  );
}

/* ---------- Kategoriyalar CRUD ---------- */
function CategoriesTab() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", slug: "" });
  const [slugTouched, setSlugTouched] = useState(false);
  const [editId, setEditId] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await categoriesApi.list();
      setItems(unwrapList(res.data).items);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function reset() {
    setForm({ name: "", slug: "" });
    setSlugTouched(false);
    setEditId(null);
    setErrors({});
  }

  async function submit(e) {
    e.preventDefault();
    const v = {};
    if (!form.name.trim()) v.name = "Name can't be empty.";
    if (!SLUG_RE.test(form.slug)) v.slug = "Use lowercase letters, numbers and dashes only.";
    if (items.some((c) => c.slug === form.slug && c.id !== editId)) v.slug = "This slug is already taken.";
    setErrors(v);
    if (Object.keys(v).length) return;
    setSaving(true);
    try {
      const body = { name: form.name.trim(), slug: form.slug };
      if (editId) await categoriesApi.update(editId, body);
      else await categoriesApi.create(body);
      toast.success(editId ? "Category updated" : "Category added 🎉");
      reset();
      load();
    } catch (err) {
      if (err.response?.status === 409) setErrors({ slug: "This slug is already taken." });
      else setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      await categoriesApi.remove(toDelete.id);
      toast.success("Category deleted");
      setItems((x) => x.filter((c) => c.id !== toDelete.id));
      setToDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not delete (maybe it has properties)."));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="cat-admin">
      <form className="cat-form" onSubmit={submit} noValidate>
        <h3>{editId ? "Edit category" : "Add category"}</h3>
        <label>Name</label>
        <input
          value={form.name}
          placeholder="Apartment"
          onChange={(e) => setForm({ name: e.target.value, slug: slugTouched ? form.slug : slugify(e.target.value) })}
          className={errors.name ? "invalid" : ""}
        />
        <FieldError>{errors.name}</FieldError>
        <label>Slug</label>
        <input
          value={form.slug}
          placeholder="apartment"
          onChange={(e) => {
            setSlugTouched(true);
            setForm({ ...form, slug: e.target.value.toLowerCase() });
          }}
          className={errors.slug ? "invalid" : ""}
        />
        <FieldError>{errors.slug}</FieldError>
        <div className="row-end">
          {editId && (
            <button type="button" className="btn btn-ghost" onClick={reset}>
              Cancel
            </button>
          )}
          <button className="btn btn-primary" disabled={saving}>
            <Plus size={16} /> {editId ? "Save" : "Add"}
          </button>
        </div>
      </form>

      <div className="cat-list">
        {loading ? (
          <Spinner />
        ) : items.length === 0 ? (
          <EmptyState emoji="🏷️" title="No categories yet" text="Add the first one on the left." />
        ) : (
          items.map((c, i) => (
            <Reveal className="cat-row" key={c.id} delay={i * 40}>
              <div>
                <strong>{c.name}</strong>
                <code>{c.slug}</code>
              </div>
              <div className="card-actions">
                <button
                  className="icon-btn"
                  onClick={() => {
                    setEditId(c.id);
                    setSlugTouched(true);
                    setForm({ name: c.name, slug: c.slug });
                  }}
                  title="Edit"
                >
                  <Pencil size={15} />
                </button>
                <button className="icon-btn danger" onClick={() => setToDelete(c)} title="Delete">
                  <Trash2 size={15} />
                </button>
              </div>
            </Reveal>
          ))
        )}
      </div>

      <ConfirmDialog open={Boolean(toDelete)} title="Delete category?" text={`"${toDelete?.name}" will be deleted.`} onConfirm={confirmDelete} onClose={() => setToDelete(null)} busy={deleting} />
    </div>
  );
}

function Admin() {
  const [tab, setTab] = useState("moderation");
  const tabs = [
    ["moderation", "Moderation", <ClipboardList size={16} key="i" />],
    ["users", "Users", <Users size={16} key="i" />],
    ["categories", "Categories", <Tags size={16} key="i" />],
  ];

  return (
    <section className="container section dashboard">
      <Reveal className="dash-hero">
        <div>
          <span className="eyebrow">
            <ShieldCheck size={14} /> ADMIN PANEL
          </span>
          <h1>Keep EstatePro trustworthy</h1>
          <p className="muted">Review new listings, manage categories and see who's joined.</p>
        </div>
        <div className="tabs">
          {tabs.map(([k, l, icon]) => (
            <button key={k} className={tab === k ? "on" : ""} onClick={() => setTab(k)}>
              {icon} {l}
            </button>
          ))}
        </div>
      </Reveal>

      {tab === "moderation" && <Moderation />}
      {tab === "users" && <UsersTab />}
      {tab === "categories" && <CategoriesTab />}
    </section>
  );
}

export default Admin;
