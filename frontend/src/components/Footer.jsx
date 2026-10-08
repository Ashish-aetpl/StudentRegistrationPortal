import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="container py-4">
        <div className="row g-4">
          <div className="col-12 col-md-6">
            <h2>National Centre for Medium Range Weather Forecasting</h2>
            <p className="mb-0">
              Ministry of Earth Sciences, Government of India.
              <br />
              Special Campaign 6.0 — Student Poster Making &amp; Elocution.
            </p>
          </div>

          <div className="col-6 col-md-3">
            <h2>Quick Links</h2>
            <ul className="footer-links">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/registration">Registration</Link></li>
              <li><Link to="/gallery">Gallery</Link></li>
              <li><Link to="/admin">Admin Login</Link></li>
            </ul>
          </div>

          <div className="col-6 col-md-3">
            <h2>Related Sites</h2>
            <ul className="footer-links">
              <li><a href="https://nwp.ncmrwf.gov.in/" target="_blank" rel="noreferrer">NCMRWF NWP Portal</a></li>
              <li><a href="https://moes.gov.in/" target="_blank" rel="noreferrer">Ministry of Earth Sciences</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        © {new Date().getFullYear()} NCMRWF, Ministry of Earth Sciences, Government of India. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
