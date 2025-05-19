import { useState, useEffect } from 'react';
import { SubdomainData } from '../types';
import { scrapeSubdomains } from '../content_subdomain_scraper';
interface SubdomainViewProps {
  onBack: () => void;
}

const SubdomainView = ({ onBack }: SubdomainViewProps) => {
  const [subdomains, setSubdomains] = useState<SubdomainData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'domain' | 'traffic'>('traffic');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterType, setFilterType] = useState<'all' | 'subdomain' | 'subfolder'>('all');

  // 加载子域名/子文件夹数据
  useEffect(() => {
    const loadSubdomains = async () => {
      try {
        setLoading(true);

        // 从后台脚本获取所有子域名/子文件夹数据
        chrome.runtime.sendMessage({ action: 'get_all_subdomains' }, (response) => {
          if (chrome.runtime.lastError) {
            setError(chrome.runtime.lastError.message || '获取数据失败');
            setLoading(false);
            return;
          }
          
          if (response && response.success) {
            setSubdomains(response.data || []);
          } else {
            setError(response?.error || '获取数据失败');
          }
          setLoading(false);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : '未知错误');
        setLoading(false);
      }
    };
    
    loadSubdomains();
  }, []);

  // 过滤和排序数据
  const filteredAndSortedSubdomains = subdomains
    .filter(item => {
      // 根据类型过滤
      if (filterType === 'subdomain' && !item.isSubdomain) return false;
      if (filterType === 'subfolder' && item.isSubdomain) return false;
      
      // 根据搜索词过滤
      if (filter) {
        const lowerFilter = filter.toLowerCase();
        return (
          item.domain.toLowerCase().includes(lowerFilter) ||
          item.link.toLowerCase().includes(lowerFilter) ||
          (item.parentDomain && item.parentDomain.toLowerCase().includes(lowerFilter))
        );
      }
      return true;
    })
    .sort((a, b) => {
      // 排序
        console.log('a.traffic', a);
      if (sortBy === 'domain') {
        return sortOrder === 'asc'
          ? a.domain.localeCompare(b.domain)
          : b.domain.localeCompare(a.domain);
      } else {
        // 按流量排序，需要将流量字符串转换为数字
        const trafficA = parseInt(a.traffic.replace(/[^\d]/g, '')) || 0;
        const trafficB = parseInt(b.traffic.replace(/[^\d]/g, '')) || 0;
        return sortOrder === 'asc' ? trafficA - trafficB : trafficB - trafficA;
      }
    });

  // 导出数据为CSV
  const exportToCsv = () => {
    if (subdomains.length === 0) return;
    
    // 准备CSV表头
    const headers = [
      '域名',
      '链接',
      '流量',
      '桌面占比',
      '移动占比',
      '类型',
      '父域名',
      '抓取时间'
    ];
    
    // 转换数据为CSV行
    const rows = filteredAndSortedSubdomains.map(item => [
      item.domain,
      item.link,
      item.traffic,
      item.desktopShare,
      item.mobileShare,
      item.isSubdomain ? '子域名' : '子文件夹',
      item.parentDomain || '',
      new Date(item.captured_at).toLocaleString()
    ]);
    
    // 组合表头和行数据
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // 创建Blob对象
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // 创建下载链接
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `subdomains-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    
    // 触发下载
    link.click();
    
    // 清理
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 渲染加载状态
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mb-4"></div>
        <p className="text-gray-600">正在加载子域名/子文件夹数据...</p>
      </div>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
        <button 
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
          onClick={onBack}
        >
          返回
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">子域名/子文件夹数据</h2>
        <button 
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded text-sm"
          onClick={onBack}
        >
          返回
        </button>
      </div>
      
      <div className="p-4 border-b">
        <div className="flex flex-col gap-3">
          {/* 搜索和过滤控件 */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="搜索域名或链接..."
              className="flex-1 border rounded px-3 py-2 text-sm"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <select
              className="border rounded px-3 py-2 text-sm"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'all' | 'subdomain' | 'subfolder')}
            >
              <option value="all">全部</option>
              <option value="subdomain">仅子域名</option>
              <option value="subfolder">仅子文件夹</option>
            </select>
          </div>
          
          {/* 排序控件 */}
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-600">排序:</span>
              <select
                className="border rounded px-2 py-1 text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'domain' | 'traffic')}
              >
                <option value="domain">域名</option>
                <option value="traffic">流量</option>
              </select>
              <button
                className="border rounded px-2 py-1 text-sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
            
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
              onClick={exportToCsv}
              disabled={filteredAndSortedSubdomains.length === 0}
            >
              导出CSV
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        {filteredAndSortedSubdomains.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4">
            <p className="text-gray-500">暂无数据</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredAndSortedSubdomains.map((item) => (
              <div key={item.id} className="p-3 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-1">
                  <div className="font-medium truncate flex-1">{item.domain}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${item.isSubdomain ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                    {item.isSubdomain ? '子域名' : '子文件夹'}
                  </span>
                </div>
                
                <div className="text-xs text-gray-500 truncate mb-2">
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {item.link}
                  </a>
                </div>
                
                <div className="flex gap-4 text-xs">
                  <div className="flex flex-col">
                    <span className="text-gray-500">流量</span>
                    <span className="font-medium">{item.traffic}</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-gray-500">桌面占比</span>
                    <span className="font-medium">{item.desktopShare}</span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-gray-500">移动占比</span>
                    <span className="font-medium">{item.mobileShare}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-3 border-t bg-gray-50 text-xs text-gray-500">
        共 {filteredAndSortedSubdomains.length} 条数据 (总计 {subdomains.length} 条)
      </div>
    </div>
  );
};

export default SubdomainView; 