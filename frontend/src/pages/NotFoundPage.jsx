import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="container py-5">
      <div className="panel">
        <h1 className="panel-title">Page Not Found</h1>
        <div className="panel-body">
          <p>The page you are looking for does not exist or has been moved.</p>
          <Link to="/" className="btn-main">Go to Home</Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
