import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, Trash2, UploadCloud } from "lucide-react";
import { FieldError } from "./ui";
import { useToast } from "../context/ToastContext";
import { categoriesApi, getErrorMessage, getFieldErrors, imageUrl, propertiesApi, sortedImages, unwrapList } from "../services/api";
import { CURRENCIES, LISTING_TYPES } from "../utils/constants";

const MAX_MB = 5;
const EMPTY = {
  title: "",
  description: "",
  price: "",
  currency: "USD",
  listingType: "SALE",
  categoryId: "",
  address: "",
  city: "",
  area: "",
  rooms: "",
  bathrooms: "",
};

// E'lon yaratish / tahrirlash (8.2). Oqim: POST /properties (JSON) -> POST /properties/:id/images (multipart)
function PropertyForm({ initial, onSaved, onCancel }) {
  const toast = useToast();
  const isEdit = Boolean(initial?.id);
  const [form, setForm] = useState(() =>
    isEdit
      ? Object.fromEntries(Object.keys(EMPTY).map((k) => [k, initial[k] == null ? EMPTY[k] : String(initial[k])]))
      : EMPTY
  );
  const [categories, setCategories] = useState([]);
  const [files, setFiles] = useState([]);
  const [existing, setExisting] = useState(() => sortedImages(initial));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEdit) setForm((f) => ({ ...f, categoryId: String(initial.categoryId ?? initial.category?.id ?? "") }));
    categoriesApi
      .list()
      .then((r) => setCategories(unwrapList(r.data).items))
      .catch(() => toast.error("Could not load categories."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const previews = useMemo(() => files.map((f) => ({ file: f, url: URL.createObjectURL(f) })), [files]);
  useEffect(() => () => previews.forEach((p) => URL.revokeObjectURL(p.url)), [previews]);

  function set(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => ({ ...e, [name]: "" }));
  }

  function addFiles(list) {
    const ok = [];
    Array.from(list).forEach((f) => {
      if (!f.type.startsWith("image/")) toast.error(`${f.name}: only images are allowed.`);
      else if (f.size > MAX_MB * 1024 * 1024) toast.error(`${f.name}: max ${MAX_MB} MB.`);
      else ok.push(f);
    });
    setFiles((prev) => [...prev, ...ok]);
    setErrors((e) => ({ ...e, images: "" }));
  }

  function validate() {
    const e = {};
    const t = form.title.trim().length;
    if (t < 5 || t > 150) e.title = "Title must be 5–150 characters.";
    if (form.description.trim().length < 20) e.description = "Description must be at least 20 characters.";
    if (!(Number(form.price) > 0)) e.price = "Price must be a positive number.";
    if (!form.currency) e.currency = "Choose a currency.";
    if (!["SALE", "RENT"].includes(form.listingType)) e.listingType = "Choose SALE or RENT.";
    if (!form.categoryId) e.categoryId = "Choose a category.";
    if (!form.address.trim()) e.address = "Address can't be empty.";
    if (!form.city.trim()) e.city = "City can't be empty.";
    if (!(Number(form.area) > 0)) e.area = "Area must be positive.";
    if (!(Number.isInteger(Number(form.rooms)) && Number(form.rooms) > 0)) e.rooms = "Rooms must be a positive whole number.";
    if (!(Number.isInteger(Number(form.bathrooms)) && Number(form.bathrooms) >= 0) || form.bathrooms === "") e.bathrooms = "Bathrooms must be 0 or more.";
    if (existing.length + files.length < 1) e.images = "Add at least one photo.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function removeExisting(img) {
    try {
      await propertiesApi.removeImage(initial.id, img.id);
      setExisting((x) => x.filter((i) => i.id !== img.id));
      toast.success("Photo removed");
    } catch (err) {
      toast.error(getErrorMessage(err, "Could not remove photo."));
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setSaving(true);
    const catId = /^\d+$/.test(String(form.categoryId)) ? Number(form.categoryId) : form.categoryId;
    const body = {
      title: form.title.trim(),
      description: form.description.trim(),
      price: Number(form.price),
      currency: form.currency,
      listingType: form.listingType,
      categoryId: catId,
      address: form.address.trim(),
      city: form.city.trim(),
      area: Number(form.area),
      rooms: parseInt(form.rooms, 10),
      bathrooms: parseInt(form.bathrooms, 10),
    };
    try {
      const res = isEdit ? await propertiesApi.update(initial.id, body) : await propertiesApi.create(body);
      const saved = res.data?.data || res.data;
      const id = saved?.id ?? initial?.id;
      if (files.length) {
        try {
          await propertiesApi.uploadImages(id, files);
        } catch (err) {
          toast.error(`Listing saved, but photos failed: ${getErrorMessage(err)}`);
        }
      }
      onSaved?.(saved, isEdit);
    } catch (err) {
      setErrors(getFieldErrors(err));
      toast.error(getErrorMessage(err, "Could not save the listing."));
    } finally {
      setSaving(false);
    }
  }

  const field = (name, label, { wide, ...props } = {}) => (
    <div className={`field ${wide ? "wide" : ""}`}>
      <label>{label}</label>
      <input value={form[name]} onChange={(e) => set(name, e.target.value)} className={errors[name] ? "invalid" : ""} {...props} />
      <FieldError>{errors[name]}</FieldError>
    </div>
  );

  return (
    <form className="property-form" onSubmit={submit} noValidate>
      {!isEdit && <div className="info-note">New listings start as <b>Pending</b> — an admin reviews them before they go public. ⏳</div>}

      <div className="form-grid">
        {field("title", "Title", { placeholder: "Sunny 3-room apartment near the park", wide: true, maxLength: 150 })}

        <div className="field wide">
          <label>Description</label>
          <textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="What makes this home special? Light, view, neighbours, renovation..." className={errors.description ? "invalid" : ""} />
          <FieldError>{errors.description}</FieldError>
        </div>

        <div className="field">
          <label>Listing type</label>
          <div className="segmented">
            {LISTING_TYPES.map((t) => (
              <button type="button" key={t.value} className={form.listingType === t.value ? "on" : ""} onClick={() => set("listingType", t.value)}>
                {t.label}
              </button>
            ))}
          </div>
          <FieldError>{errors.listingType}</FieldError>
        </div>

        <div className="field">
          <label>Category</label>
          <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} className={errors.categoryId ? "invalid" : ""}>
            <option value="">Choose category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <FieldError>{errors.categoryId}</FieldError>
        </div>

        {field("price", "Price", { type: "number", min: "0", placeholder: "85000" })}

        <div className="field">
          <label>Currency</label>
          <select value={form.currency} onChange={(e) => set("currency", e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <FieldError>{errors.currency}</FieldError>
        </div>

        {field("city", "City", { placeholder: "Tashkent" })}
        {field("address", "Address", { placeholder: "Chilonzor, 9-kvartal" })}
        {field("area", "Area (m²)", { type: "number", min: "0", placeholder: "72" })}
        {field("rooms", "Rooms", { type: "number", min: "1", step: "1", placeholder: "3" })}
        {field("bathrooms", "Bathrooms", { type: "number", min: "0", step: "1", placeholder: "1" })}

        <div className="field wide">
          <label>Photos</label>
          <div
            className={`dropzone ${drag ? "drag" : ""} ${errors.images ? "invalid" : ""}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              addFiles(e.dataTransfer.files);
            }}
          >
            <UploadCloud size={30} className="dz-icon" />
            <strong>Drop photos here or click to browse</strong>
            <small>JPG, PNG, WEBP · up to {MAX_MB} MB each</small>
            <input ref={inputRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFiles(e.target.files)} />
          </div>
          <FieldError>{errors.images}</FieldError>

          {(existing.length > 0 || previews.length > 0) && (
            <div className="thumbs">
              {existing.map((img) => (
                <div className="thumb" key={`e${img.id}`}>
                  <img src={imageUrl(img)} alt={img.altText || ""} />
                  <button type="button" onClick={() => removeExisting(img)} aria-label="Remove photo">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {previews.map((p, i) => (
                <div className="thumb new" key={p.url}>
                  <img src={p.url} alt="" />
                  <button type="button" onClick={() => setFiles((f) => f.filter((_, idx) => idx !== i))} aria-label="Remove photo">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button type="button" className="thumb add" onClick={() => inputRef.current?.click()}>
                <ImagePlus size={20} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="row-end sticky-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <span className="btn-dots">Saving</span> : isEdit ? "Save changes" : "Publish listing"}
        </button>
      </div>
    </form>
  );
}

export default PropertyForm;
