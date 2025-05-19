import { useState, useEffect, StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/globals.css';
import { PlatformType, KeywordData, Sim3ueKeywordData, SumrushKeywordData } from '../types/index';
import SubdomainView from './SubdomainView';
import MainView from './components/MainView';
import Header from './components/Header';

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

  // 根据当前视图渲染不同的内容
  const renderContent = () => {
    switch (currentView) {
      case 'subdomain':
        return <SubdomainView onBack={() => setCurrentView('main')} />;
      case 'main':
      default:
        return (
          <MainView
            loading={loading}
            error={error}
            platform={platform}
            isSubdomainPage={isSubdomainPage}
            keyword={keyword}
            isFetching={isFetching}
            fetchStatus={fetchStatus}
            keywordData={keywordData}
            isSaving={isSaving}
            onFetchData={fetchKeywordData}
            onSaveData={saveKeywordData}
            fetchSubdomainData={fetchSubdomainData}
          />
        );
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-[400px] overflow-hidden">
      <Header
        platform={platform}
        isSubdomainPage={isSubdomainPage}
        onSubdomainClick={() => setCurrentView('subdomain')}
        getPlatformName={getPlatformName}
        getPlatformBadgeClass={getPlatformBadgeClass}
      />
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