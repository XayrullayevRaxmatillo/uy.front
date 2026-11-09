// Enumlar — backend bilan bir xil (Notion qo'llanma, 4-bo'lim)
export const ROLES = { USER: "USER", ADMIN: "ADMIN" };

export const LISTING_TYPES = [
  { value: "SALE", label: "For Sale" },
  { value: "RENT", label: "For Rent" },
];

export const STATUSES = {
  PENDING: { label: "Pending", emoji: "⏳" },
  APPROVED: { label: "Approved", emoji: "✅" },
  REJECTED: { label: "Rejected", emoji: "✖️" },
};

export const CURRENCIES = ["USD", "UZS"];

export const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
];

export const POPULAR_CITIES = ["Tashkent", "Samarkand", "Bukhara", "Andijan", "Namangan", "Fergana", "Khiva", "Nukus"];

// Validation (8.2-bo'lim)
export const PHONE_RE = /^\+?[0-9\s()-]{7,20}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/['ʻʼ`’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 5) return { text: "Still up", emoji: "🌙" };
  if (h < 12) return { text: "Good morning", emoji: "☀️" };
  if (h < 18) return { text: "Good afternoon", emoji: "🌤️" };
  return { text: "Good evening", emoji: "🌆" };
}
