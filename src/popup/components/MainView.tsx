import React from 'react';
import { PlatformType, KeywordData } from '../../types';
import TrendsChart from './TrendsChart';
import StatusMessage from './StatusMessage';
import FetchButton from './FetchButton';
import ExportButton from './ExportButton';
import KeywordDataView from './KeywordDataView';

interface MainViewProps {
  loading: boolean;
  error: string | null;
  platform: PlatformType | null;
  isSubdomainPage: boolean;
  keyword: string | null;
  isFetching: boolean;
  fetchStatus: { success?: boolean; message?: string; } | null;
  keywordData: KeywordData | null;
  isSaving: boolean;
  onFetchData: () => void;
  onSaveData: () => void;
  fetchSubdomainData: () => void;
}

const MainView: React.FC<MainViewProps> = ({
  loading,
  error,
  platform,
  isSubdomainPage,
  keyword,
  isFetching,
  fetchStatus,
  keywordData,
  isSaving,
  onFetchData,
  onSaveData,
  fetchSubdomainData,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-gray-600">正在识别当前页面...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
        <p className="text-sm text-gray-600">
          请确保您正在访问支持的平台页面，或者刷新页面后重试。
        </p>
      </div>
    );
  }

  // 检查是否为子域名/子文件夹页面
  if (platform === 'sim3ue' && isSubdomainPage) {
    return (
      <div className="p-4">
        <div className="bg-blue-100 border border-blue-300 text-blue-800 px-4 py-3 rounded mb-4">
          <p>检测到当前页面为子域名/子文件夹数据页面</p>
        </div>
        
        <button
          className="w-full bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded mb-4"
          onClick={fetchSubdomainData}
        >
          抓取子域名/子文件夹数据
        </button>
        
        <p className="text-sm text-gray-600">
          点击上方按钮抓取当前页面的子域名/子文件夹数据。
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">关键词数据</h2>
            {keyword && (
              <p className="text-sm text-gray-600">
                当前关键词: <span className="font-medium">{keyword}</span>
              </p>
            )}
          </div>
          
          <FetchButton isFetching={isFetching} onClick={onFetchData} />
        </div>
        
        <StatusMessage status={fetchStatus} />
      </div>
      
      {keywordData && (
        <>
          <TrendsChart keywordData={keywordData} />
          <KeywordDataView keywordData={keywordData} />
          
          <div className="p-4 border-t mt-auto">
            <ExportButton isSaving={isSaving} onClick={onSaveData} />
          </div>
        </>
      )}
    </div>
  );
};

export default MainView; 