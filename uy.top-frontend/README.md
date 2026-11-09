# EstatePro — Real Estate Marketplace (Frontend)

React + Vite frontend. Notion qo'llanmadagi API shartnomasiga (6–8-bo'limlar) to'liq mos.

## Ishga tushirish

```bash
npm install
cp .env.example .env   # kerak bo'lsa VITE_API_URL ni o'zgartiring
npm run dev            # http://localhost:5173
```

Backend (NestJS) `http://localhost:3000` da ishlashi va CORS'da `http://localhost:5173` ga ruxsat berishi kerak.

## .env

| O'zgaruvchi | Default | Izoh |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | Backend manzili |
| `VITE_IMAGE_FIELD` | `images` | Multer'dagi fayl maydoni nomi (`FilesInterceptor('images')`) |

## Sahifalar

| Route | Kirish | Endpointlar |
|---|---|---|
| `/` | Guest | `GET /properties`, `GET /categories` |
| `/properties` | Guest | `GET /properties` (city, category, type, minPrice, maxPrice, rooms, sort, page, limit — URL query'da saqlanadi) |
| `/properties/:id` | Guest (favorite/inquiry uchun login) | `GET /properties/:id`, `POST/DELETE /favorites/:id`, `POST /properties/:id/inquiries` |
| `/login`, `/register` | Guest | `POST /auth/login`, `POST /auth/register`, `GET /auth/me` |
| `/dashboard` | Login | `GET /properties/my` (yo'q bo'lsa `/users/me/properties`), `POST/PATCH/DELETE /properties`, `POST/DELETE /properties/:id/images`, `GET/PATCH /users/me` |
| `/favorites` | Login | `GET/DELETE /favorites` |
| `/inquiries` | Login | `GET /inquiries/my` |
| `/admin` | Admin | `GET /admin/properties?status=`, `PATCH /admin/properties/:id/status`, `GET /admin/users`, `/categories` CRUD |

## Kelishuvlar

- Token: `localStorage.token`, har so'rovda `Authorization: Bearer <accessToken>`. 401 bo'lsa avtomatik logout.
- Auth javobi: `{ accessToken, user }` (`access_token` / `token` ham qabul qilinadi).
- Ro'yxat javobi: `{ data, meta: { page, limit, total, totalPages } }` yoki oddiy massiv.
- Xatolar: NestJS formati — `message` matn yoki massiv; massiv bo'lsa maydon yonida ko'rsatiladi.
- Rasm: avval `POST /properties` (JSON), keyin `POST /properties/:id/images` (multipart). Rasm URL'i `API_URL + image.url`.
- Kategoriya filtri `category` query parametriga **id** yuboradi.
- Validation qoidalari 8.2-bo'limga mos (parol ≥ 8, title 5–150, description ≥ 20, price/area/rooms > 0, bathrooms ≥ 0, kamida 1 rasm, ≤ 5 MB).

## Tuzilma

```
src/
├── components/   Navbar, Footer, PropertyCard, ProtectedRoute, FavoriteButton, PropertyForm, AuthLayout, ui
├── pages/        Home, Properties, PropertyDetail, Login, Register, Dashboard, Favorites, Inquiries, Admin
├── services/     api.js
├── context/      AuthContext, ToastContext
├── utils/        constants (enumlar), confetti
├── App.jsx, main.jsx, index.css
```
