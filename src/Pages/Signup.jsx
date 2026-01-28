import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import Api from "../api/axios.jsx";
import "./Styles/Signup.css";

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const err = {};

    if (!name.trim()) {
      err.name = "Name is required";
    }

    if (!email.trim()) {
      err.email = "Email is required";

    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      err.email = "Please enter a valid email";
    }

    if (!password.trim()) {
      err.password = "Password is required";

    } else if (password.length < 6) {
      err.password = "Minimum 6 characters";
    }

    return err;
  };

  const signup = async (e) => {
    e.preventDefault();

    const err = validateForm();
    if (Object.keys(err).length > 0) {
      setErrors(err);
      return;
    }

    setLoading(true);

    try {
      const res = await Api.post("/signup", { name, email, password });
      toast.success("Signup successful ✅");
      setTimeout(() => {

        navigate("/login");
      }, 1500)
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-wrapper">
        <div className="signup-card">
          <div className="signup-header">
            <h2>Create Account</h2>
            <p>Join us today</p>
          </div>

          <form className="signup-form" onSubmit={signup}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors({ ...errors, name: "" });
                }}
                className={errors.name ? "input-error" : ""}
                disabled={loading}
              />
              {errors.name && <p className="error-text">{errors.name}</p>}
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setErrors({ ...errors, email: "" });
                }}
                className={errors.email ? "input-error" : ""}
                disabled={loading}
              />
              {errors.email && <p className="error-text">{errors.email}</p>}
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="Enter password (min 6 chars)"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors({ ...errors, password: "" });
                }}
                className={errors.password ? "input-error" : ""}
                disabled={loading}
              />
              {errors.password && <p className="error-text">{errors.password}</p>}
            </div>

            <button type="submit" className="signup-btn" disabled={loading}>
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <div className="signup-footer">
            Already have an account? <Link to="/login">Login here</Link>
          </div>
        </div>

        <div className="signup-info">
          <div className="info-card">
            <h3>🚀 Why Join Us?</h3>
            <ul>
              <li>Easy-to-use form builder</li>
              <li>Real-time analytics</li>
              <li>Secure data storage</li>
              <li>24/7 Support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;