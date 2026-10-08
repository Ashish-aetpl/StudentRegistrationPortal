import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import Header from './Header';
import Navbar from './Navbar';
import Footer from './Footer';

// Shared page frame: header, menu, page content, footer.
// Renders `children` when given (admin login page), otherwise the matched route.
const SiteLayout = ({ children }) => {
  const { pathname } = useLocation();

  // Start each new page at the top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <Header />
      <Navbar />
      <main id="main-content">
        {children ?? <Outlet />}
      </main>
      <Footer />
    </>
  );
};

export default SiteLayout;
