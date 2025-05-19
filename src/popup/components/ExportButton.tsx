import React from 'react';

interface ExportButtonProps {
  isSaving: boolean;
  onClick: () => void;
}

const ExportButton: React.FC<ExportButtonProps> = ({ isSaving, onClick }) => {
  return (
    <button
      className={`w-full py-2 px-4 rounded ${
        isSaving
          ? 'bg-gray-300 cursor-not-allowed'
          : 'bg-green-500 hover:bg-green-600 text-white'
      }`}
      onClick={onClick}
      disabled={isSaving}
    >
      {isSaving ? '导出中...' : '导出JSON'}
    </button>
  );
};

export default ExportButton; 