import React from 'react';
import { Link } from 'react-router-dom';

import CampaignBanner from '../components/CampaignBanner';
import NoticeBoard from '../components/NoticeBoard';
import { EVENTS } from '../constants';

const HomePage = ({ stats }) => {
  return (
    <>
      <CampaignBanner />

      <div className="container py-4">
        <div className="row g-4">
          <div className="col-12 col-lg-8">
            <section className="panel" aria-labelledby="events-title">
              <h2 className="panel-title" id="events-title">Student Events</h2>
              <div className="panel-body">
                <p>Students may register for one or both of the following events:</p>
                <div className="row g-3 mb-3">
                  {EVENTS.map((event) => (
                    <div className="col-12 col-md-6" key={event.name}>
                      <div className="event-summary">
                        <strong>{event.name}</strong>
                        <small>{event.description}</small>
                      </div>
                    </div>
                  ))}
                </div>
                <Link to="/registration" className="btn-main">Go to Registration Form</Link>
              </div>
            </section>
          </div>

          <div className="col-12 col-lg-4">
            <NoticeBoard stats={stats} />
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;
