import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

const Header = () => {
  return (
    <header className="site-header">
      <div className="container">
        <Link to="/" className="brand">
          <img src={logo} alt="NCMRWF logo" className="brand-logo-img" width="350" height="425" />
          <div>
            <p className="brand-name fw-bold">National Centre for Medium Range Weather Forecasting</p>
            <p className="brand-sub">Ministry of Earth Sciences, Government of India</p>
          </div>
        </Link>

        <div className="header-campaign">
          <strong>Special Campaign 6.0</strong>
          <span>Student Registration Portal</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
