import { useState, useEffect, StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/globals.css';
import { PlatformType, KeywordData, Sim3ueKeywordData, SumrushKeywordData } from '../types/index';
import SubdomainView from './SubdomainView';

// 类型守卫函数，用于区分不同平台的数据
function isSim3ueData(data: KeywordData): data is Sim3ueKeywordData {
  return data.platform === 'sim3ue';
}

function isSumrushData(data: KeywordData): data is SumrushKeywordData {
  return data.platform === 'sumrush';
}

// 定义视图类型
type ViewType = 'main' | 'subdomain';

const Popup = () => {
  const [platform, setPlatform] = useState<PlatformType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<{success?: boolean; message?: string} | null>(null);
  const [keywordData, setKeywordData] = useState<KeywordData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>('main');
  const [isSubdomainPage, setIsSubdomainPage] = useState(false);
  
  // 检测当前页面是否为子域名/子文件夹数据页面
  const checkIfSubdomainPage = async () => {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab && activeTab.url) {
        const isSubdomain = activeTab.url.includes('sem.3ue.co/analytics/traffic/subfolders-subdomains');
        setIsSubdomainPage(isSubdomain);
        
        // 如果是子域名页面，直接切换到子域名视图
        if (isSubdomain) {
          setCurrentView('subdomain');
        }
      }
    } catch (err) {
      console.error('检查页面类型失败:', err);
    }
  };
  
  useEffect(() => {
    const getCurrentPlatform = async () => {
      try {
        setLoading(true);
        
        // 检查当前页面是否为子域名页面
        await checkIfSubdomainPage();
        
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

  // 手动抓取子域名/子文件夹数据
  const fetchSubdomainData = async () => {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!activeTab || !activeTab.id) {
        throw new Error('无法获取当前标签页');
      }
      
      // 发送消息触发子域名/子文件夹数据抓取
      chrome.tabs.sendMessage(activeTab.id, { action: 'manual_scrape_subdomains' }, (response) => {
        if (chrome.runtime.lastError) {
          alert('抓取失败：' + (chrome.runtime.lastError.message || '内容脚本未响应'));
          return;
        }
        
        if (response && response.success) {
          alert(`成功抓取 ${response.count} 条子域名/子文件夹数据`);
        } else {
          alert('抓取失败：' + (response?.error || '未知错误'));
        }
      });
    } catch (err) {
      alert('抓取失败：' + (err instanceof Error ? err.message : '未知错误'));
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

  // 渲染页头
  const renderHeader = () => {
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
              onClick={() => setCurrentView('subdomain')}
            >
              子域名数据
            </button>
          )}
        </div>
      </div>
    );
  };

  // 渲染趋势图
  const renderTrends = () => {
    if (!keywordData || !keywordData.trends || !keywordData.trends.chartUrl) {
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

  // 渲染关键词数据
  const renderKeywordData = () => {
    if (!keywordData) {
      return null;
    }
    
    // 根据平台类型渲染不同的数据
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

  // 渲染主视图
  const renderMainView = () => {
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
            
            <button
              className={`px-4 py-2 rounded ${
                isFetching
                  ? 'bg-gray-300 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
              onClick={fetchKeywordData}
              disabled={isFetching}
            >
              {isFetching ? '抓取中...' : '抓取数据'}
            </button>
          </div>
          
          {fetchStatus && (
            <div className={`p-3 rounded mb-4 ${
              fetchStatus.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <p>{fetchStatus.message}</p>
            </div>
          )}
        </div>
        
        {keywordData && (
          <>
            {renderTrends()}
            {renderKeywordData()}
            
            <div className="p-4 border-t mt-auto">
              <button
                className={`w-full py-2 px-4 rounded ${
                  isSaving
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
                onClick={saveKeywordData}
                disabled={isSaving}
              >
                {isSaving ? '导出中...' : '导出JSON'}
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  // 根据当前视图渲染不同的内容
  const renderContent = () => {
    switch (currentView) {
      case 'subdomain':
        return <SubdomainView onBack={() => setCurrentView('main')} />;
      case 'main':
      default:
        return renderMainView();
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-[400px] overflow-hidden">
      {renderHeader()}
      {renderContent()}
    </div>
  );
};

// 渲染应用
const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <StrictMode>
      <Popup />
    </StrictMode>
  );
}

export default Popup; 