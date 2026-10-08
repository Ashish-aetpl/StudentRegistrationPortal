import React from 'react';

import RegistrationForm from '../components/RegistrationForm';
import NoticeBoard from '../components/NoticeBoard';

const RegistrationPage = ({ stats, onRegistered }) => {
  return (
    <div className="container py-4">
      <div className="row g-4">
        <div className="col-12 col-lg-8 order-2 order-lg-1">
          <RegistrationForm stats={stats} onRegistered={onRegistered} />
        </div>
        <div className="col-12 col-lg-4 order-1 order-lg-2">
          <NoticeBoard stats={stats} />
        </div>
      </div>
    </div>
  );
};

export default RegistrationPage;
