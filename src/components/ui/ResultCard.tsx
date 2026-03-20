import React from 'react';

const ResultCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`result-card ${className}`}>
    {children}
  </div>
);

export default ResultCard;
