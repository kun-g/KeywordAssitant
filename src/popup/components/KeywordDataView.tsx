import React from 'react';
import { KeywordData, Sim3ueKeywordData, SumrushKeywordData } from '../../types';

interface KeywordDataViewProps {
  keywordData: KeywordData;
}

// 类型守卫函数
function isSim3ueData(data: KeywordData): data is Sim3ueKeywordData {
  return data.platform === 'sim3ue';
}

function isSumrushData(data: KeywordData): data is SumrushKeywordData {
  return data.platform === 'sumrush';
}

// 格式化数据显示
const formatValue = (value: any): string => {
  if (value === undefined || value === null) return '未知';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const KeywordDataView: React.FC<KeywordDataViewProps> = ({ keywordData }) => {
  if (isSim3ueData(keywordData)) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded">
            <h3 className="text-xs font-medium text-gray-500 mb-1">搜索量</h3>
            <p className="text-lg font-semibold">{keywordData.volume}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <h3 className="text-xs font-medium text-gray-500 mb-1">点击量</h3>
            <p className="text-lg font-semibold">{keywordData.clicks}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <h3 className="text-xs font-medium text-gray-500 mb-1">点击率</h3>
            <p className="text-lg font-semibold">{keywordData.clickThroughRate}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <h3 className="text-xs font-medium text-gray-500 mb-1">难度</h3>
            <p className="text-lg font-semibold">{keywordData.difficulty}</p>
          </div>
        </div>
        
        {keywordData.devices && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">设备分布</h3>
            <div className="flex gap-4">
              <div className="bg-gray-50 p-3 rounded flex-1">
                <h4 className="text-xs font-medium text-gray-500 mb-1">桌面端</h4>
                <p className="text-lg font-semibold">{keywordData.devices.desktop}</p>
              </div>
              <div className="bg-gray-50 p-3 rounded flex-1">
                <h4 className="text-xs font-medium text-gray-500 mb-1">移动端</h4>
                <p className="text-lg font-semibold">{keywordData.devices.mobile}</p>
              </div>
            </div>
          </div>
        )}
        
        {keywordData.relatedKeywords && keywordData.relatedKeywords.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">相关关键词</h3>
            <div className="bg-gray-50 rounded overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">关键词</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">搜索量</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">点击率</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">难度</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {keywordData.relatedKeywords.map((item, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 text-xs">{item.keyword}</td>
                      <td className="px-3 py-2 text-xs">{item.volume}</td>
                      <td className="px-3 py-2 text-xs">{item.clickThroughRate}</td>
                      <td className="px-3 py-2 text-xs">{item.kd}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {keywordData.topCompetitors && keywordData.topCompetitors.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">主要竞争对手</h3>
            <div className="bg-gray-50 rounded overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">网站</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">点击量</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {keywordData.topCompetitors.map((item, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 text-xs">{item.website}</td>
                      <td className="px-3 py-2 text-xs">{item.clicks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  } else if (isSumrushData(keywordData)) {
    return (
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded">
            <h3 className="text-xs font-medium text-gray-500 mb-1">搜索量</h3>
            <p className="text-lg font-semibold">{keywordData.volume}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <h3 className="text-xs font-medium text-gray-500 mb-1">难度</h3>
            <p className="text-lg font-semibold">{keywordData.difficulty}</p>
          </div>
        </div>
        
        {keywordData.region && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">地区</h3>
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-base">{keywordData.region.name} ({keywordData.region.code})</p>
            </div>
          </div>
        )}
        
        {keywordData.countryDistribution && Object.keys(keywordData.countryDistribution).length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">国家分布</h3>
            <div className="bg-gray-50 rounded overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">国家</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">搜索量</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.entries(keywordData.countryDistribution).map(([country, volume], index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 text-xs">{country}</td>
                      <td className="px-3 py-2 text-xs">{volume}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {keywordData.relatedKeywords && keywordData.relatedKeywords.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">相关关键词</h3>
            <div className="bg-gray-50 rounded overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">关键词</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">搜索量</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">难度</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {keywordData.relatedKeywords.map((item, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 text-xs">{item.keyword}</td>
                      <td className="px-3 py-2 text-xs">{item.volume}</td>
                      <td className="px-3 py-2 text-xs">{item.difficulty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {keywordData.topCompetitors && keywordData.topCompetitors.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">主要竞争对手</h3>
            <div className="bg-gray-50 rounded overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">网站</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">流量</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {keywordData.topCompetitors.map((item, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 text-xs">{item.website}</td>
                      <td className="px-3 py-2 text-xs">{item.traffic}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  } else {
    // 通用关键词数据显示
    return (
      <div className="p-4">
        <div className="bg-gray-50 p-4 rounded">
          <h3 className="text-sm font-medium mb-2">关键词数据</h3>
          <div className="space-y-2">
            {Object.entries(keywordData).map(([key, value]) => {
              if (key !== 'platform' && key !== 'captured_at' && key !== 'source_url') {
                return (
                  <div key={key} className="flex">
                    <span className="text-xs font-medium text-gray-500 w-1/3">{key}:</span>
                    <span className="text-xs flex-1">{formatValue(value)}</span>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
    );
  }
};

export default KeywordDataView; 