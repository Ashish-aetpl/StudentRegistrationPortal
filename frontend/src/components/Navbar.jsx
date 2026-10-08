import React, { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/registration', label: 'Registration' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/admin', label: 'Admin Login' }
];

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="main-nav" aria-label="Main navigation">
      <div className="container">
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={menuOpen}
          aria-controls="main-menu"
          onClick={() => setMenuOpen((open) => !open)}
        >
          ☰ Menu
        </button>

        <ul id="main-menu" className={`nav-menu ${menuOpen ? 'open' : ''}`}>
          {LINKS.map((link) => (
            <li key={link.to}>
              <NavLink to={link.to} end={link.end} onClick={closeMenu}>
                {link.label}
              </NavLink>
            </li>
          ))}
          <li className="nav-register">
            <Link to="/registration" onClick={closeMenu}>Register Now</Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
