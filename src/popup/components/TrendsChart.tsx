import React from 'react';
import { KeywordData } from '../../types';

interface TrendsChartProps {
  keywordData: KeywordData | null;
}

const TrendsChart: React.FC<TrendsChartProps> = ({ keywordData }) => {
  if (!keywordData?.trends?.chartUrl) {
    return null;
  }

  return (
    <div className="p-4 border-b">
      <h3 className="text-sm font-medium mb-2">搜索趋势</h3>
      <div className="bg-gray-50 p-2 rounded">
        <img 
          src={keywordData.trends.chartUrl} 
          alt="Search Trend" 
          className="w-full h-auto"
        />
      </div>
    </div>
  );
};

export default TrendsChart; 