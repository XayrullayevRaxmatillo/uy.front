import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { FieldError } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage, getFieldErrors } from "../services/api";
import { EMAIL_RE, PHONE_RE } from "../utils/constants";
import { confetti } from "../utils/confetti";

function strength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
const STRENGTH = ["Too short", "Okay", "Good", "Strong", "Superb 💪"];

function Register() {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [shake, setShake] = useState(0);

  if (isAuthenticated && !loading) return <Navigate to="/dashboard" replace />;

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  }

  // 8.2 — Register formasi qoidalari
  function validate() {
    const v = {};
    const name = form.fullName.trim();
    if (name.length < 2 || name.length > 100) v.fullName = "Full name must be 2–100 characters.";
    if (!EMAIL_RE.test(form.email.trim())) v.email = "Please enter a valid email.";
    if (form.phone.trim() && !PHONE_RE.test(form.phone.trim())) v.phone = "Phone format looks wrong, e.g. +998 90 123 45 67";
    if (form.password.length < 8) v.password = "Password must contain at least 8 characters.";
    setErrors(v);
    return Object.keys(v).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!validate()) {
      setShake((s) => s + 1);
      return;
    }

    setLoading(true);
    try {
      const body = { fullName: form.fullName.trim(), email: form.email.trim(), password: form.password };
      if (form.phone.trim()) body.phone = form.phone.trim();
      await register(body);
      confetti();
      toast.success(`Welcome to EstatePro, ${body.fullName.split(" ")[0]}! 🎉`);
      navigate("/dashboard");
    } catch (err) {
      if (err.response?.status === 409) {
        setErrors({ email: "This email is already registered. Try logging in." });
      } else {
        setErrors(getFieldErrors(err));
        setError(getErrorMessage(err, "Registration failed."));
      }
      setShake((s) => s + 1);
    } finally {
      setLoading(false);
    }
  }

  const st = strength(form.password);

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join EstatePro and find your dream home."
      side={
        <>
          <strong>“Every great home starts with a first step.”</strong>
          <span>Save favorites, message sellers and list your own home — free.</span>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate key={shake} className={shake ? "shake" : ""}>
        {error && <div className="error-message">{error}</div>}

        <label>Full Name</label>
        <div className="input-icon">
          <User size={16} />
          <input type="text" name="fullName" placeholder="Enter your full name" value={form.fullName} onChange={handleChange} className={errors.fullName ? "invalid" : ""} />
        </div>
        <FieldError>{errors.fullName}</FieldError>

        <label>Email Address</label>
        <div className="input-icon">
          <Mail size={16} />
          <input type="email" name="email" placeholder="example@gmail.com" value={form.email} onChange={handleChange} autoComplete="email" className={errors.email ? "invalid" : ""} />
        </div>
        <FieldError>{errors.email}</FieldError>

        <label>
          Phone Number <span className="muted">(optional)</span>
        </label>
        <div className="input-icon">
          <Phone size={16} />
          <input type="tel" name="phone" placeholder="+998 90 123 45 67" value={form.phone} onChange={handleChange} className={errors.phone ? "invalid" : ""} />
        </div>
        <FieldError>{errors.phone}</FieldError>

        <label>Password</label>
        <div className="input-icon">
          <Lock size={16} />
          <input type={show ? "text" : "password"} name="password" placeholder="At least 8 characters" value={form.password} onChange={handleChange} autoComplete="new-password" className={errors.password ? "invalid" : ""} />
          <button type="button" className="eye" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}>
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {form.password && (
          <div className={`strength s${st}`}>
            <div className="bars">
              {[0, 1, 2, 3].map((i) => (
                <i key={i} className={i < st ? "on" : ""} />
              ))}
            </div>
            <small>{STRENGTH[st]}</small>
          </div>
        )}
        <FieldError>{errors.password}</FieldError>

        <button type="submit" className="btn btn-primary full lg" disabled={loading}>
          {loading ? <span className="btn-dots">Creating account</span> : "Create Account"}
        </button>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default Register;
