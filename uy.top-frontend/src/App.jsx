import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import { NotFound } from "./components/ui";
import Home from "./pages/Home";
import Properties from "./pages/Properties";
import PropertyDetail from "./pages/PropertyDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Favorites from "./pages/Favorites";
import Inquiries from "./pages/Inquiries";
import Admin from "./pages/Admin";

function App() {
  const location = useLocation();

  // Har sahifa almashganda tepaga
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <Navbar />
      <main className="page-transition" key={location.pathname}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/properties" element={<Properties />} />
          <Route path="/properties/:id" element={<PropertyDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/inquiries" element={<Inquiries />} />
          </Route>

          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin" element={<Admin />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
