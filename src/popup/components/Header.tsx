import React from 'react';
import { PlatformType } from '../../types';

interface HeaderProps {
  platform: PlatformType | null;
  isSubdomainPage: boolean;
  onSubdomainClick: () => void;
  getPlatformName: (platform: PlatformType | null) => string;
  getPlatformBadgeClass: (platform: PlatformType | null) => string;
}

const Header: React.FC<HeaderProps> = ({
  platform,
  isSubdomainPage,
  onSubdomainClick,
  getPlatformName,
  getPlatformBadgeClass,
}) => {
  return (
    <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold mr-2">KeywordAssistant</h1>
        {platform && (
          <span className={`text-xs px-2 py-0.5 rounded-full text-white ${getPlatformBadgeClass(platform)}`}>
            {getPlatformName(platform)}
          </span>
        )}
      </div>
      <div className="flex space-x-2">
        {!isSubdomainPage && (
          <button
            className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded"
            onClick={onSubdomainClick}
          >
            子域名数据
          </button>
        )}
      </div>
    </div>
  );
};

export default Header; 