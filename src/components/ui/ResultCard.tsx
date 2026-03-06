import React from 'react';

interface ResultCardProps {
  children: React.ReactNode;
  className?: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ children, className = '' }) => {
  return (
    <div className={`result-card ${className}`}>
      {children}
    </div>
  );
};

export default ResultCard;
