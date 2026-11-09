import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi, favoritesApi, unwrapList } from "../services/api";
import { ROLES } from "../utils/constants";

const AuthContext = createContext(null);

function favId(f) {
  return String(f?.propertyId ?? f?.property?.id ?? f?.id);
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem("token")));
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
    setFavoriteIds(new Set());
  }, []);

  const loadFavorites = useCallback(async () => {
    try {
      const res = await favoritesApi.list();
      const { items } = unwrapList(res.data);
      setFavoriteIds(new Set(items.map(favId)));
      return items;
    } catch {
      return [];
    }
  }, []);

  // Sahifa yangilanganda GET /auth/me bilan userni tiklash
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    authApi
      .me()
      .then((res) => {
        if (cancelled) return;
        setUser(res.data?.user || res.data);
        loadFavorites();
      })
      .catch(() => !cancelled && logout())
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [token, logout, loadFavorites]);

  useEffect(() => {
    const onExpired = () => logout();
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, [logout]);

  const saveSession = useCallback((data) => {
    const accessToken = data?.accessToken || data?.access_token || data?.token;
    if (!accessToken) throw new Error("Token was not returned by the server.");
    localStorage.setItem("token", accessToken);
    if (data.user) setUser(data.user);
    setToken(accessToken);
    return data.user;
  }, []);

  const login = useCallback(
    async (email, password) => {
      const res = await authApi.login({ email, password });
      return saveSession(res.data);
    },
    [saveSession]
  );

  const register = useCallback(
    async (form) => {
      const res = await authApi.register(form);
      // Agar register token qaytarsa — darhol kirgan bo'lamiz, aks holda login qilamiz
      if (res.data?.accessToken || res.data?.access_token || res.data?.token) return saveSession(res.data);
      return login(form.email, form.password);
    },
    [saveSession, login]
  );

  const toggleFavorite = useCallback(
    async (propertyId) => {
      const key = String(propertyId);
      const had = favoriteIds.has(key);
      // Optimistik yangilash
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        had ? next.delete(key) : next.add(key);
        return next;
      });
      try {
        if (had) await favoritesApi.remove(propertyId);
        else await favoritesApi.add(propertyId);
        return !had;
      } catch (err) {
        // 409 — allaqachon bor: holat to'g'ri, qaytarmaymiz
        if (err.response?.status === 409) return true;
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          had ? next.add(key) : next.delete(key);
          return next;
        });
        throw err;
      }
    },
    [favoriteIds]
  );

  const value = useMemo(
    () => ({
      token,
      user,
      setUser,
      loading,
      isAuthenticated: Boolean(token),
      isAdmin: user?.role === ROLES.ADMIN,
      login,
      register,
      logout,
      favoriteIds,
      toggleFavorite,
      loadFavorites,
    }),
    [token, user, loading, login, register, logout, favoriteIds, toggleFavorite, loadFavorites]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
