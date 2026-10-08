import React from 'react';

const NoticeBoard = ({ stats }) => {
  return (
    <aside className="panel" aria-labelledby="notice-title">
      <h2 className="panel-title" id="notice-title">Important Notice</h2>
      <div className="panel-body">
        {stats && (
          <div className={`seats-box ${stats.open ? '' : 'closed'}`}>
            <strong>{stats.remaining}</strong>
            <span>{stats.open ? `of ${stats.max} seats remaining` : 'Registration closed — all seats filled'}</span>
          </div>
        )}

        <ol className="notice-list">
          <li>Only the first <strong>{stats?.max || 150} candidates</strong> will be allowed to participate.</li>
          <li><strong>A3 drawing paper</strong> will be provided at the venue.</li>
          <li>Finished posters will be retained in the archives at <strong>NCMRWF</strong> after evaluation.</li>
          <li>NCMRWF will have the right to use the posters physically or digitally for the ongoing campaign or any future events.</li>
        </ol>
      </div>
    </aside>
  );
};

export default NoticeBoard;
