import axios from "axios";

// Backend manzili .env faylidan olinadi (VITE_API_URL)
export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/+$/, "");
export const IMAGE_FIELD = import.meta.env.VITE_IMAGE_FIELD || "images";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Har bir so'rovga token qo'shiladi: Authorization: Bearer <accessToken>
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 — token eskirgan bo'lsa, foydalanuvchini chiqaramiz
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem("token")) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("auth:expired"));
    }
    return Promise.reject(error);
  }
);

/* ---------------- Yordamchi funksiyalar ---------------- */

// NestJS xato formati: message ba'zan matn, ba'zan massiv
export function getErrorMessage(error, fallback = "Something went wrong.") {
  const msg = error?.response?.data?.message;
  if (Array.isArray(msg)) return msg.join(". ");
  if (typeof msg === "string" && msg) return msg;
  if (error?.code === "ERR_NETWORK") return "Cannot reach the server. Is the backend running?";
  return error?.message || fallback;
}

// class-validator xabarlarini maydonlarga ajratish: "price must be..." -> { price: "..." }
export function getFieldErrors(error) {
  const msg = error?.response?.data?.message;
  const list = Array.isArray(msg) ? msg : typeof msg === "string" ? [msg] : [];
  const out = {};
  list.forEach((m) => {
    const field = String(m).split(" ")[0];
    if (/^[a-zA-Z]+$/.test(field) && !out[field]) out[field] = m;
  });
  return out;
}

// Pagination javobi: { data, meta } yoki oddiy massiv
export function unwrapList(payload) {
  if (Array.isArray(payload)) return { items: payload, meta: null };
  const items = payload?.data || payload?.items || payload?.results || [];
  return { items: Array.isArray(items) ? items : [], meta: payload?.meta || null };
}

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=70",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=70",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=70",
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=70",
  "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=70",
  "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=70",
];

export function fallbackImage(seed = 0) {
  const n = Math.abs(String(seed).split("").reduce((a, c) => a + c.charCodeAt(0), 0));
  return FALLBACK_IMAGES[n % FALLBACK_IMAGES.length];
}

// Backend /uploads/... qaytaradi -> API_URL + url
export function imageUrl(img) {
  const url = typeof img === "string" ? img : img?.url;
  if (!url) return null;
  if (/^(https?:|data:|blob:)/.test(url)) return url;
  return `${API_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}

export function sortedImages(property) {
  return [...(property?.images || [])].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function coverImage(property) {
  return imageUrl(sortedImages(property)[0]) || fallbackImage(property?.id);
}

export function formatPrice(price, currency = "USD") {
  const n = Number(price);
  if (Number.isNaN(n)) return `${price} ${currency}`;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${n.toLocaleString("en-US")} ${currency}`;
  }
}

export function formatDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

/* ---------------- Endpointlar (Notion qo'llanma, 7-bo'lim) ---------------- */

export const authApi = {
  register: (body) => api.post("/auth/register", body),
  login: (body) => api.post("/auth/login", body),
  me: () => api.get("/auth/me"),
};

export const usersApi = {
  me: () => api.get("/users/me"),
  update: (body) => api.patch("/users/me", body),
};

export const categoriesApi = {
  list: () => api.get("/categories"),
  create: (body) => api.post("/categories", body),
  update: (id, body) => api.patch(`/categories/${id}`, body),
  remove: (id) => api.delete(`/categories/${id}`),
};

export const propertiesApi = {
  list: (params) => api.get("/properties", { params }),
  get: (id) => api.get(`/properties/${id}`),
  create: (body) => api.post("/properties", body),
  update: (id, body) => api.patch(`/properties/${id}`, body),
  remove: (id) => api.delete(`/properties/${id}`),
  // 7.9: "Mening e'lonlarim" — /properties/my, bo'lmasa /users/me/properties
  async mine() {
    try {
      return await api.get("/properties/my");
    } catch (err) {
      const s = err.response?.status;
      if (s && s !== 401 && s !== 403) return api.get("/users/me/properties");
      throw err;
    }
  },
  uploadImages(id, files, altText) {
    const fd = new FormData();
    files.forEach((f) => fd.append(IMAGE_FIELD, f));
    if (altText) fd.append("altText", altText);
    return api.post(`/properties/${id}/images`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  removeImage: (id, imageId) => api.delete(`/properties/${id}/images/${imageId}`),
};

export const favoritesApi = {
  list: () => api.get("/favorites"),
  add: (propertyId) => api.post(`/favorites/${propertyId}`),
  remove: (propertyId) => api.delete(`/favorites/${propertyId}`),
};

export const inquiriesApi = {
  send: (propertyId, body) => api.post(`/properties/${propertyId}/inquiries`, body),
  mine: () => api.get("/inquiries/my"),
};

export const adminApi = {
  properties: (params) => api.get("/admin/properties", { params }),
  setStatus: (id, status) => api.patch(`/admin/properties/${id}/status`, { status }),
  users: () => api.get("/admin/users"),
};

export default api;
