import React from "react";
import { Link } from "react-router-dom";
import "../Pages/Styles/Landing.css";

const Landing = () => {
  return (
    <div className="landing-wrapper">
      {/* Animated Background */}
      <div className="background-animation">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
        <div className="shape shape-3"></div>
      </div>

      <div className="landing-container">
        {/* Header with Logo */}
        <header className="landing-header">
          <div className="logo-section">
            <div className="logo-icon">
              <span className="globe">🌍</span>
              <span className="book">📚</span>
            </div>
            <div className="logo-text">
              <h1 className="company-name">Growth Overseas</h1>
              <p className="company-tagline">International Edutech</p>
            </div>
          </div>
        </header>

        {/* Main Content Card */}
        <main className="landing-main">
          <div className="content-card">
            {/* Left Section */}
            <div className="left-section">
              {/* Icon Banner */}
              <div className="icon-banner">
                <span className="banner-icon">🎓</span>
              </div>

              {/* Title Section */}
              <div className="title-section">
                <h2 className="main-title">Student Registration Portal</h2>
                <p className="main-subtitle">
                  Streamline your international education journey with our
                  advanced client management system
                </p>
              </div>

              {/* Features Grid */}
              <div className="features-grid">
                <div className="feature-item">
                  <span className="feature-icon">⚡</span>
                  <span className="feature-text">Quick Setup</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🔒</span>
                  <span className="feature-text">Secure Data</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🌐</span>
                  <span className="feature-text">Global Access</span>
                </div>
              </div>
            </div>

            {/* Right Section */}
            <div className="right-section">
              {/* Action Buttons */}
              <div className="action-buttons">
                <Link to="/signup" className="action-btn primary-btn">
                  <div className="btn-content">
                    <span className="btn-icon">🚀</span>
                    <div className="btn-text-group">
                      <span className="btn-title">Create Account</span>
                      <span className="btn-subtitle">
                        Register as New Admin
                      </span>
                    </div>
                  </div>
                  <span className="btn-arrow">→</span>
                </Link>

                <Link to="/login" className="action-btn secondary-btn">
                  <div className="btn-content">
                    <span className="btn-icon">🔐</span>
                    <div className="btn-text-group">
                      <span className="btn-title">Admin Login</span>
                      <span className="btn-subtitle">
                        Access Your Dashboard
                      </span>
                    </div>
                  </div>
                  <span className="btn-arrow">→</span>
                </Link>
              </div>

              {/* Trust Badge */}
              <div className="trust-section">
                <div className="trust-badge">
                  <span className="badge-icon">✓</span>
                  <span className="badge-text">
                    Trusted by 500+ Education Consultants
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="landing-footer">
          <div className="footer-content">
            <p className="footer-text">
              Empowering dreams • Connecting futures • Building success
            </p>
            <p className="footer-copyright">
              © 2025 Growth Overseas International Edutech
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Landing;