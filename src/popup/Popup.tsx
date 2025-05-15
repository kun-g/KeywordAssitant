import { useState, useEffect, StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/globals.css';
import { Backlink, LinkStatus } from '../types';

const Popup = () => {
  const [backlinks, setBacklinks] = useState<Backlink[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('all');

  // 获取存储的外链数据
  useEffect(() => {
    const fetchBacklinks = async () => {
      try {
        setLoading(true);
        const { backlinks = [] } = await chrome.storage.local.get('backlinks');
        setBacklinks(backlinks);
      } catch (error) {
        console.error('获取外链数据失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBacklinks();
  }, []);

  // 根据标签筛选外链
  const filteredBacklinks = activeTab === 'all' 
    ? backlinks 
    : backlinks.filter(link => link.status === activeTab);

  // 过滤标签选项
  const tabOptions: {id: string; label: string}[] = [
    { id: 'all', label: '全部' },
    { id: 'pending', label: '待处理' },
    { id: 'submitted', label: '已提交' },
    { id: 'success', label: '成功' },
    { id: 'failed', label: '失败' }
  ];

  // 获取状态对应的颜色
  const getStatusColor = (status: LinkStatus): string => {
    switch (status) {
      case 'pending': return 'bg-gray-200';
      case 'submitted': return 'bg-blue-200';
      case 'success': return 'bg-green-200';
      case 'failed': return 'bg-red-200';
      case 'ignored': return 'bg-yellow-200';
      default: return 'bg-gray-200';
    }
  };

  // 渲染外链卡片
  const renderBacklink = (link: Backlink) => (
    <div 
      key={link.id} 
      className="p-3 border rounded-lg mb-2 hover:bg-gray-50"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <a 
            href={link.source_url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline font-medium text-sm"
          >
            {link.source_url.length > 40 ? link.source_url.slice(0, 40) + '...' : link.source_url}
          </a>
          <div className="text-xs text-gray-500 mt-1">
            锚文本: {link.anchor} | {link.nofollow ? 'NoFollow' : 'DoFollow'}
          </div>
        </div>
        <div className={`${getStatusColor(link.status)} px-2 py-1 rounded text-xs`}>
          {link.status === 'pending' && '待处理'}
          {link.status === 'submitted' && '已提交'}
          {link.status === 'success' && '成功'}
          {link.status === 'failed' && '失败'}
          {link.status === 'ignored' && '已忽略'}
        </div>
      </div>
      {link.error && (
        <div className="mt-1 text-xs text-red-500">
          错误: {link.error}
        </div>
      )}
      <div className="flex mt-2 space-x-2">
        <button 
          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
          onClick={() => {/* 提交链接函数 */}}
        >
          提交
        </button>
        <button 
          className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300"
          onClick={() => {/* 忽略链接函数 */}}
        >
          忽略
        </button>
      </div>
    </div>
  );

  // 添加测试数据按钮点击处理函数
  const handleAddTestData = async () => {
    const testData: Backlink[] = [
      {
        id: Date.now().toString(),
        source_url: 'https://example.com/blog',
        anchor: 'Example Link',
        target_url: 'https://yourdomain.com',
        type: 'blog',
        platform: 'wordpress',
        nofollow: false,
        status: 'pending',
        created_at: Date.now(),
        updated_at: Date.now()
      }
    ];

    try {
      const { backlinks = [] } = await chrome.storage.local.get('backlinks');
      const updatedBacklinks = [...backlinks, ...testData];
      await chrome.storage.local.set({ backlinks: updatedBacklinks });
      setBacklinks(updatedBacklinks);
    } catch (error) {
      console.error('添加测试数据失败:', error);
    }
  };

  return (
    <div className="w-96 p-4">
      <header className="mb-4">
        <h1 className="text-xl font-bold">LinkPilot</h1>
      </header>

      {/* 选项卡 */}
      <div className="flex border-b mb-4">
        {tabOptions.map(tab => (
          <button
            key={tab.id}
            className={`py-2 px-3 text-sm ${activeTab === tab.id ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 数据加载中 */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* 无数据显示 */}
          {backlinks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <p className="text-gray-500 mb-4">暂无外链数据</p>
              <button 
                className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 text-sm"
                onClick={handleAddTestData}
              >
                添加测试数据
              </button>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-96">
              {filteredBacklinks.map(renderBacklink)}
            </div>
          )}
        </>
      )}
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