import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import AuthLayout from "../components/AuthLayout";
import { FieldError } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getErrorMessage } from "../services/api";
import { EMAIL_RE, greeting } from "../utils/constants";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [shake, setShake] = useState(0);

  const from = location.state?.from || "/";
  if (isAuthenticated && !loading) return <Navigate to={from} replace />;

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const v = {};
    if (!EMAIL_RE.test(form.email)) v.email = "Please enter a valid email.";
    if (!form.password) v.password = "Password can't be empty.";
    setErrors(v);
    if (Object.keys(v).length) {
      setShake((s) => s + 1);
      return;
    }

    setLoading(true);
    try {
      const user = await login(form.email.trim(), form.password);
      const g = greeting();
      toast.success(`${g.text}${user?.fullName ? `, ${user.fullName.split(" ")[0]}` : ""}! ${g.emoji}`);
      navigate(from, { replace: true });
    } catch (err) {
      const status = err.response?.status;
      setError(status === 401 ? "Email or password is incorrect." : getErrorMessage(err, "Login failed."));
      setShake((s) => s + 1);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Login to your EstatePro account"
      side={
        <>
          <strong>“Home is where your story begins.”</strong>
          <span>Your saved homes are waiting for you 💛</span>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate key={shake} className={shake ? "shake" : ""}>
        {error && <div className="error-message">{error}</div>}

        <label>Email Address</label>
        <div className="input-icon">
          <Mail size={16} />
          <input type="email" name="email" placeholder="example@gmail.com" value={form.email} onChange={handleChange} autoComplete="email" className={errors.email ? "invalid" : ""} />
        </div>
        <FieldError>{errors.email}</FieldError>

        <label>Password</label>
        <div className="input-icon">
          <Lock size={16} />
          <input type={show ? "text" : "password"} name="password" placeholder="Enter password" value={form.password} onChange={handleChange} autoComplete="current-password" className={errors.password ? "invalid" : ""} />
          <button type="button" className="eye" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"}>
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <FieldError>{errors.password}</FieldError>

        <button type="submit" className="btn btn-primary full lg" disabled={loading}>
          {loading ? <span className="btn-dots">Logging in</span> : "Login"}
        </button>

        <p className="auth-switch">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default Login;
