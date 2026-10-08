import React from 'react';
import { Link } from 'react-router-dom';

const CampaignBanner = () => {
  return (
    <section className="campaign-banner">
      <div className="container">
        <h1>Special Campaign 6.0</h1>
        <div className="banner-dates">2 October – 31 October 2026</div>
        <p>
          <strong>Special Campaign 6.0</strong>, organized by the DARPG, is a nationwide drive across
          Indian central government offices to institutionalize cleanliness and enhance efficiency.
          It focuses on disposing of pending matters, streamlining physical spaces, and emphasizing
          environmentally sound e-waste segregation and scientific recycling. Monitored via the
          central SCDPM portal, the campaign aims to clear administrative bottlenecks, free up office
          space, and promote sustainable governance.
        </p>
        <div className="d-flex flex-wrap gap-2 mt-3">
          <Link to="/registration" className="btn-accent">Register a Student</Link>
          <Link to="/gallery" className="btn-outline-main">View Gallery</Link>
        </div>
      </div>
    </section>
  );
};

export default CampaignBanner;
