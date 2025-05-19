import { useState, useEffect, StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/globals.css';
import { PlatformType, KeywordData, Sim3ueKeywordData, SumrushKeywordData } from '../types/index';

// 类型守卫函数，用于区分不同平台的数据
function isSim3ueData(data: KeywordData): data is Sim3ueKeywordData {
  return data.platform === 'sim3ue';
}

function isSumrushData(data: KeywordData): data is SumrushKeywordData {
  return data.platform === 'sumrush';
}

const Popup = () => {
  const [platform, setPlatform] = useState<PlatformType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<{success?: boolean; message?: string} | null>(null);
  const [keywordData, setKeywordData] = useState<KeywordData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    const getCurrentPlatform = async () => {
      try {
        setLoading(true);
        // 获取当前标签页
        const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (!activeTab || !activeTab.id) {
          setError('无法获取当前标签页');
          setLoading(false);
          return;
        }
        
        // 向当前标签页发送消息获取平台信息
        chrome.tabs.sendMessage(activeTab.id, { action: 'get_platform' }, (response) => {
          if (chrome.runtime.lastError) {
            setError(chrome.runtime.lastError.message || '内容脚本未响应');
            setLoading(false);
            return;
          }
          
          if (response && response.platform) {
            setPlatform(response.platform);
            
            // 如果是支持的平台，尝试获取关键词
            if ((response.platform === 'sim3ue' || response.platform === 'sumrush') && activeTab.id) {
              chrome.tabs.sendMessage(activeTab.id, { action: 'get_keyword' }, (keywordResponse) => {
                if (keywordResponse && keywordResponse.keyword) {
                  setKeyword(keywordResponse.keyword);
                }
              });
            }
          } else {
            setError('无法识别平台');
          }
          setLoading(false);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误');
        setLoading(false);
      }
    };
    
    getCurrentPlatform();
  }, []);

  // 抓取关键词数据
  const fetchKeywordData = async () => {
    try {
      setIsFetching(true);
      setFetchStatus(null);
      setKeywordData(null);
      
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!activeTab || !activeTab.id) {
        throw new Error('无法获取当前标签页');
      }
      
      // 发送消息触发关键词数据抓取
      chrome.tabs.sendMessage(activeTab.id, { action: 'fetch_keyword_data' }, (response) => {
        if (chrome.runtime.lastError) {
          setFetchStatus({ 
            success: false, 
            message: chrome.runtime.lastError.message || '抓取失败：内容脚本未响应' 
          });
          setIsFetching(false);
          return;
        }
        
        if (response && response.success) {
          setFetchStatus({ 
            success: true, 
            message: `成功抓取"${response.data.keyword || '页面'}"数据`
          });
          
          // 设置抓取到的关键词数据
          setKeywordData(response.data);
        } else {
          setFetchStatus({ 
            success: false, 
            message: response?.error || '抓取失败'
          });
        }
        setIsFetching(false);
      });
    } catch (err) {
      setFetchStatus({ 
        success: false, 
        message: err instanceof Error ? err.message : '未知错误'
      });
      setIsFetching(false);
    }
  };

  // 根据平台类型获取友好的显示名称
  const getPlatformName = (platform: PlatformType | null): string => {
    if (!platform) return '未识别';
    
    switch (platform) {
      case 'ahrefs':
        return 'Ahrefs';
      case 'sim3ue':
        return 'Sim3ue关键词平台';
      case 'sumrush':
        return 'SumRush';
      case 'custom':
        return '自定义平台';
      case 'unknown':
      default:
        return '未识别平台';
    }
  };
  
  // 根据平台类型获取不同的样式
  const getPlatformBadgeClass = (platform: PlatformType | null): string => {
    if (!platform) return 'bg-gray-500';
    
    switch (platform) {
      case 'ahrefs':
        return 'bg-green-500';
      case 'sim3ue':
        return 'bg-purple-500';
      case 'sumrush':
        return 'bg-orange-500';
      case 'custom':
        return 'bg-orange-500';
      case 'unknown':
      default:
        return 'bg-gray-500';
    }
  };

  // 格式化数据显示
  const formatValue = (value: any): string => {
    if (value === undefined || value === null) return '未知';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  // 导出关键词数据为JSON文件
  const saveKeywordData = () => {
    if (!keywordData) return;
    
    try {
      setIsSaving(true);
      
      // 准备要导出的数据
      const dataToExport = {
        ...JSON.parse(JSON.stringify(keywordData)),
        exported_at: new Date().toISOString(),
      };
      
      // 如果有base64版本的图表，使用它替换Blob URL以便持久保存
      if (dataToExport.trends && dataToExport.trends.chartBase64) {
        dataToExport.trends.chartUrl = dataToExport.trends.chartBase64;
        delete dataToExport.trends.chartBase64; // 删除多余的字段
      }
      
      // 创建Blob对象
      const jsonString = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // 创建下载链接
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${keywordData.keyword || 'keyword'}.json`;
      
      // 触发下载
      document.body.appendChild(a);
      a.click();
      
      // 清理
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setIsSaving(false);
      
      // 显示成功提示
      setFetchStatus({
        success: true,
        message: `成功保存"${keywordData.keyword}"数据为JSON文件`
      });
      
      // 3秒后清除提示
      setTimeout(() => {
        setFetchStatus(prevStatus => {
          // 只有当当前消息是保存成功提示时才清除
          if (prevStatus?.message?.includes('成功保存') && prevStatus.success) {
            return null;
          }
          return prevStatus;
        });
      }, 3000);
    } catch (err) {
      console.error('导出数据失败:', err);
      setIsSaving(false);
      setFetchStatus({
        success: false,
        message: `导出失败: ${err instanceof Error ? err.message : '未知错误'}`
      });
    }
  };

  // 通用的头部部分
  const renderHeader = () => {
    if (!keywordData) return null;
    
    return (
      <div className="bg-gray-100 px-3 py-2 font-medium border-b border-gray-200 flex justify-between items-center">
        <div>关键词数据：{keywordData.keyword}</div>
        <button
          className={`text-xs px-2 py-1 rounded text-white ${isSaving ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'}`}
          onClick={saveKeywordData}
          disabled={isSaving}
        >
          {isSaving ? '保存中...' : '保存JSON'}
        </button>
      </div>
    );
  };
  
  // 通用的趋势图部分
  const renderTrends = () => {
    if (!keywordData || !keywordData.trends || !keywordData.trends.chartUrl) return null;
    
    return (
      <div className="mt-3">
        <h3 className="font-medium mb-1">动态趋势</h3>
        <div className="flex flex-col">
          <img 
            src={keywordData.trends.chartUrl} 
            alt="趋势图" 
            className="w-full border border-gray-200 rounded"
          />
        </div>
      </div>
    );
  };

  // 根据平台类型渲染不同的关键词数据
  const renderKeywordData = () => {
    if (!keywordData) return null;
    
    // Sim3ue平台特有的数据展示
    if (isSim3ueData(keywordData)) {
      return (
        <div className="mt-4 border border-gray-200 rounded-md overflow-hidden">
          {renderHeader()}
          <div className="p-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col">
                <span className="text-gray-600">搜索量：</span>
                <span className="font-medium">{formatValue(keywordData.volume)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-600">点击量：</span>
                <span className="font-medium">{formatValue(keywordData.clicks)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-600">点击率：</span>
                <span className="font-medium">{formatValue(keywordData.clickThroughRate)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-600">难度：</span>
                <span className="font-medium">{formatValue(keywordData.difficulty)}</span>
              </div>
            </div>
            
            {keywordData.devices && (
              <div className="mt-3">
                <h3 className="font-medium mb-1">设备分布</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col">
                    <span className="text-gray-600">桌面端：</span>
                    <span className="font-medium">{formatValue(keywordData.devices.desktop)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-600">移动端：</span>
                    <span className="font-medium">{formatValue(keywordData.devices.mobile)}</span>
                  </div>
                </div>
              </div>
            )}
            
            {renderTrends()}
            
            {/* 头部网站 */}
            {keywordData.topCompetitors && keywordData.topCompetitors.length > 0 && (
              <div className="mt-3">
                <h3 className="font-medium mb-1">头部网站</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="bg-gray-50 text-left text-xs p-2 border border-gray-200">网站</th>
                        <th className="bg-gray-50 text-left text-xs p-2 border border-gray-200">点击量</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keywordData.topCompetitors.map((competitor, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="text-xs p-2 border border-gray-200">{competitor.website}</td>
                          <td className="text-xs p-2 border border-gray-200">{competitor.clicks}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* 相关关键词（带数据） */}
            {keywordData.relatedKeywords && keywordData.relatedKeywords.length > 0 && (
              <div className="mt-3">
                <h3 className="font-medium mb-1">相关关键词</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="bg-gray-50 text-left text-xs p-2 border border-gray-200">关键词</th>
                        <th className="bg-gray-50 text-left text-xs p-2 border border-gray-200">搜索量</th>
                        <th className="bg-gray-50 text-left text-xs p-2 border border-gray-200">零点击率</th>
                        <th className="bg-gray-50 text-left text-xs p-2 border border-gray-200">KD</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keywordData.relatedKeywords.slice(0, 5).map((relatedKeyword, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="text-xs p-2 border border-gray-200">{relatedKeyword.keyword}</td>
                          <td className="text-xs p-2 border border-gray-200">{relatedKeyword.volume}</td>
                          <td className="text-xs p-2 border border-gray-200">{relatedKeyword.clickThroughRate}</td>
                          <td className="text-xs p-2 border border-gray-200">{relatedKeyword.kd}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {keywordData.relatedKeywords.length > 5 && (
                    <div className="text-xs text-gray-500 mt-1">
                      显示前5个，共 {keywordData.relatedKeywords.length} 个相关词
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // Sumrush平台特有的数据展示
    if (isSumrushData(keywordData)) {
      return (
        <div className="mt-4 border border-gray-200 rounded-md overflow-hidden">
          {renderHeader()}
          <div className="p-3 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col">
                <span className="text-gray-600">搜索量：</span>
                <span className="font-medium">{formatValue(keywordData.volume)}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-600">难度：</span>
                <span className="font-medium">{formatValue(keywordData.difficulty)}%</span>
              </div>
              {keywordData.region && (
                <div className="flex flex-col col-span-2">
                  <span className="text-gray-600">地区：</span>
                  <span className="font-medium">
                    {keywordData.region.name} ({keywordData.region.code})
                  </span>
                </div>
              )}
            </div>
            
            {/* 国家分布数据 */}
            {Object.keys(keywordData.countryDistribution).length > 0 && (
              <div className="mt-3">
                <h3 className="font-medium mb-1">国家分布</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="bg-gray-50 text-left text-xs p-2 border border-gray-200">国家</th>
                        <th className="bg-gray-50 text-left text-xs p-2 border border-gray-200">搜索量</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(keywordData.countryDistribution).map(([countryCode, volume], index) => (
                        <tr key={countryCode} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="text-xs p-2 border border-gray-200">{countryCode}</td>
                          <td className="text-xs p-2 border border-gray-200">{volume}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {renderTrends()}
            
            {/* 头部网站 */}
            {keywordData.topCompetitors && keywordData.topCompetitors.length > 0 && (
              <div className="mt-3">
                <h3 className="font-medium mb-1">头部网站</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="bg-gray-50 text-left text-xs p-2 border border-gray-200">网站</th>
                        <th className="bg-gray-50 text-left text-xs p-2 border border-gray-200">流量</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keywordData.topCompetitors.map((competitor, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="text-xs p-2 border border-gray-200">{competitor.website}</td>
                          <td className="text-xs p-2 border border-gray-200">{competitor.traffic}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            {/* 相关关键词 */}
            {keywordData.relatedKeywords && keywordData.relatedKeywords.length > 0 && (
              <div className="mt-3">
                <h3 className="font-medium mb-1">相关关键词</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="bg-gray-50 text-left text-xs p-2 border border-gray-200">关键词</th>
                        <th className="bg-gray-50 text-left text-xs p-2 border border-gray-200">搜索量</th>
                        <th className="bg-gray-50 text-left text-xs p-2 border border-gray-200">难度</th>
                      </tr>
                    </thead>
                    <tbody>
                      {keywordData.relatedKeywords.slice(0, 5).map((relatedKeyword, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="text-xs p-2 border border-gray-200">{relatedKeyword.keyword}</td>
                          <td className="text-xs p-2 border border-gray-200">{relatedKeyword.volume}</td>
                          <td className="text-xs p-2 border border-gray-200">
                            {typeof relatedKeyword.difficulty === 'number' 
                              ? `${relatedKeyword.difficulty}%` 
                              : '未知'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {keywordData.relatedKeywords.length > 5 && (
                    <div className="text-xs text-gray-500 mt-1">
                      显示前5个，共 {keywordData.relatedKeywords.length} 个相关词
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    // 默认数据展示（其他平台）
    return (
      <div className="mt-4 border border-gray-200 rounded-md overflow-hidden">
        {renderHeader()}
        <div className="p-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(keywordData).map(([key, value]) => {
              // 跳过复杂对象和数组，只显示简单值
              if (typeof value === 'object' && value !== null) return null;
              if (key === 'platform' || key === 'captured_at' || key === 'source_url') return null;
              
              return (
                <div key={key} className="flex flex-col">
                  <span className="text-gray-600">{key}：</span>
                  <span className="font-medium">{formatValue(value)}</span>
                </div>
              );
            })}
          </div>
          
          {renderTrends()}
        </div>
      </div>
    );
  };

  return (
    <div className="w-96 p-4">
      <header className="mb-4">
        <h1 className="text-xl font-bold">KeywordAssistant</h1>
        
        <div className="mt-2">
          <span className="text-sm text-gray-600">当前平台：</span>
          {loading ? (
            <span className="ml-1 text-sm">加载中...</span>
          ) : error ? (
            <span className="ml-1 text-sm text-red-500">{error}</span>
          ) : (
            <span 
              className={`ml-1 px-2 py-1 text-xs rounded-full text-white ${getPlatformBadgeClass(platform)}`}
            >
              {getPlatformName(platform)}
            </span>
          )}
        </div>
      </header>
      
      {/* 关键词抓取区域 */}
      <div className="mb-4 p-3 bg-gray-50 rounded-md">
        <h2 className="text-md font-semibold mb-2">关键词数据工具</h2>
        
        {(platform === 'sim3ue' || platform === 'sumrush') && keyword && (
          <div className="mb-2">
            <span className="text-sm text-gray-600">检测到关键词：</span>
            <span className="font-medium">{keyword}</span>
          </div>
        )}
        
        <button
          className={`w-full py-2 px-4 rounded-md text-white font-medium ${
            isFetching 
              ? 'bg-gray-400 cursor-not-allowed' 
              : platform === 'sim3ue' 
                ? 'bg-purple-600 hover:bg-purple-700'
                : platform === 'sumrush'
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-blue-600 hover:bg-blue-700'
          }`}
          onClick={fetchKeywordData}
          disabled={isFetching}
        >
          {isFetching 
            ? '抓取中...' 
            : (platform === 'sim3ue' || platform === 'sumrush') && keyword 
              ? `抓取"${keyword}"数据` 
              : '抓取页面数据'
          }
        </button>
        
        {fetchStatus && (
          <div className={`mt-2 p-2 text-sm rounded ${
            fetchStatus.success 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {fetchStatus.message}
          </div>
        )}
        
        {/* 使用新的renderKeywordData函数显示抓取到的关键词数据 */}
        {keywordData && renderKeywordData()}
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <StrictMode>
    <Popup />
  </StrictMode>
);

export default Popup; 