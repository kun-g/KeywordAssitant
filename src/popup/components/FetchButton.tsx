import React from 'react';

interface FetchButtonProps {
  isFetching: boolean;
  onClick: () => void;
}

const FetchButton: React.FC<FetchButtonProps> = ({ isFetching, onClick }) => {
  return (
    <button
      className={`px-4 py-2 rounded ${
        isFetching
          ? 'bg-gray-300 cursor-not-allowed'
          : 'bg-blue-500 hover:bg-blue-600 text-white'
      }`}
      onClick={onClick}
      disabled={isFetching}
    >
      {isFetching ? '抓取中...' : '抓取数据'}
    </button>
  );
};

export default FetchButton; 