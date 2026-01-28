import React from 'react'
import { Link } from 'react-router-dom'
import "../Pages/Styles/Landing.css"

const Landing = () => {
  return (
    <div className="simple-landing">
      <div className="simple-container">
        {/* Simple Header */}
        <div className="simple-header">
          <div className="simple-logo">
            <span className="logo-icon">🏢</span>
            <span className="logo-text">GrowthCo</span>
          </div>
        </div>

        {/* Main Content */}
        <main className="simple-main">
          <div className="simple-content">
            <h1 className="simple-title">
              Client Registration
            </h1>
            <p className="simple-subtitle">
              Simple form management for your business
            </p>

            {/* Action Buttons */}
            <div className="simple-buttons">
              <Link to="/signup" className="simple-btn signup-btn">
                <span className="btn-icon">➕</span>
                <span className="btn-text">New Admin</span>
              </Link>
              
              <Link to="/login" className="simple-btn login-btn">
                <span className="btn-icon">🔐</span>
                <span className="btn-text"> Existing Admin</span>
              </Link>
            </div>

            {/* Simple Footer Note */}
            <div className="simple-footer">
              <p>Easy • Fast • Secure</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Landing