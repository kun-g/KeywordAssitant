import React from 'react';

interface StatusMessageProps {
  status: {
    success?: boolean;
    message?: string;
  } | null;
}

const StatusMessage: React.FC<StatusMessageProps> = ({ status }) => {
  if (!status || !status.message) {
    return null;
  }

  return (
    <div className={`p-3 rounded mb-4 ${
      status.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      <p>{status.message}</p>
    </div>
  );
};

export default StatusMessage; 