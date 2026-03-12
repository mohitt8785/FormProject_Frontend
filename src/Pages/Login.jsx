import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Api from "../api/axios.jsx";
import "./Styles/Login.css";

const Login = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = Enter Email, 2 = Enter OTP
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // const SESSION_TIMEOUT = 12 * 60 * 60 * 1000; // 12 hours
  const STATIC_EMAIL = "01growth.project@gmail.com";

  // Check existing session
  // useEffect(() => {
  //   const token = localStorage.getItem("token");
  //   const loginTime = localStorage.getItem("loginTime");

  //   if (token && loginTime) {
  //     const timeElapsed = Date.now() - parseInt(loginTime);
  //     if (timeElapsed < SESSION_TIMEOUT) {
  //       navigate("/home");
  //     } else {
  //       localStorage.clear();
  //       toast.warning("Session expired. Please login again.");
  //     }
  //   }
  // }, [navigate]);

  // Check existing login session

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/home");

    }
  }, [navigate]);

  // Resend timer countdown

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  // Step 1: Request OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter email");
      return;
    }

    if (email !== STATIC_EMAIL) {
      toast.error("Only admin email is allowed to login");
      return;
    }

    try {
      setLoading(true);
      const res = await Api.post("/request-otp", { email });

      toast.success("OTP sent to your email! Check inbox.");
      setStep(2);
      setResendTimer(60); // 60 seconds cooldown
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!otp.trim() || otp.length !== 6) {
      toast.error("Please enter 6-digit OTP");
      return;
    }

    try {
      setLoading(true);
      const res = await Api.post("/verify-otp", { email, otp });

      localStorage.setItem("token", res.data.token);
      // localStorage.setItem("loginTime", Date.now().toString());

      toast.success("Login successful! ✅");

      setTimeout(() => {
        navigate("/home", { replace: true });
      }, 500);
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP");
      setOtp("");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    try {
      setLoading(true);
      await Api.post("/request-otp", { email });
      toast.success("New OTP sent!");
      setResendTimer(60);
      setOtp("");
    } catch (error) {
      toast.error("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  // Back to email step
  // const handleBack = () => {
  //   setStep(1);
  //   setOtp("");
  //   setResendTimer(0);
  // };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        <div className="login-card">
          <div className="login-header">
            <h2>🔐 Admin Login</h2>
            <p>
              {step === 1
                ? "Enter your admin email to receive OTP"
                : "Enter the OTP sent to your email"}
            </p>
          </div>

          {step === 1 ? (
            // Step 1: Email Input
            <form onSubmit={handleRequestOTP} className="login-form">
              <div className="form-group">
                <label>Admin Email</label>
                <input
                  type="email"
                  placeholder="Enter-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Only authorized admin email can login
                </small>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Sending OTP..." : "Send OTP 📧"}
              </button>
            </form>
          ) : (
            // Step 2: OTP Input
            <form onSubmit={handleVerifyOTP} className="login-form">
              <div className="form-group">
                <label>Enter 6-Digit OTP</label>
                <input
                  type="text"
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '');
                    if (value.length <= 6) setOtp(value);
                  }}
                  maxLength={6}
                  disabled={loading}
                  autoFocus
                  style={{
                    fontSize: '24px',
                    letterSpacing: '8px',
                    textAlign: 'center',
                    fontWeight: 'bold'
                  }}
                />
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Sent to: {email}
                </small>
              </div>

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Verifying..." : "Verify & Login ✅"}
              </button>

              <div style={{ textAlign: 'center', marginTop: '15px' }}>
                {resendTimer > 0 ? (
                  <p style={{ color: '#666', fontSize: '14px' }}>
                    Resend OTP in {resendTimer}s
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={loading}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      cursor: 'pointer',
                      fontSize: '14px',
                      textDecoration: 'underline'
                    }}
                  >
                    Resend OTP
                  </button>
                )}
              </div>
              {/* 
              <button
                type="button"
                onClick={handleBack}
                style={{
                  marginTop: '10px',
                  background: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  padding: '10px',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                ← Change Email
              </button> */}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;