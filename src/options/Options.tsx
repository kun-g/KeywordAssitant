import { useState, useEffect, StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/globals.css';
import { SiteConfig } from '../types';

const Options = () => {
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    name: '',
    domain: '',
    tags: [],
    industry: ''
  });
  
  const [newTag, setNewTag] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [saveStatus, setSaveStatus] = useState<string>('');

  // 加载站点配置
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const { site_config } = await chrome.storage.local.get('site_config');
        
        if (site_config) {
          setSiteConfig(site_config);
        }
      } catch (error) {
        console.error('加载站点配置失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, []);

  // 保存配置
  const handleSave = async () => {
    try {
      await chrome.storage.local.set({ site_config: siteConfig });
      setSaveStatus('保存成功');
      
      setTimeout(() => {
        setSaveStatus('');
      }, 3000);
    } catch (error) {
      console.error('保存配置失败:', error);
      setSaveStatus('保存失败');
    }
  };

  // 添加标签
  const handleAddTag = () => {
    if (newTag.trim() && !siteConfig.tags.includes(newTag.trim())) {
      setSiteConfig({
        ...siteConfig,
        tags: [...siteConfig.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  // 移除标签
  const handleRemoveTag = (tag: string) => {
    setSiteConfig({
      ...siteConfig,
      tags: siteConfig.tags.filter(t => t !== tag)
    });
  };

  // 更新表单字段
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSiteConfig({
      ...siteConfig,
      [name]: value
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">LinkPilot 设置</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">站点信息配置</h2>
        
        <div className="space-y-4">
          {/* 站点名称 */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              站点名称
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={siteConfig.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="输入您的站点名称"
            />
          </div>
          
          {/* 主域名 */}
          <div>
            <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-1">
              主域名
            </label>
            <input
              type="text"
              id="domain"
              name="domain"
              value={siteConfig.domain}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="example.com"
            />
          </div>
          
          {/* 行业 */}
          <div>
            <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
              行业
            </label>
            <select
              id="industry"
              name="industry"
              value={siteConfig.industry}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">选择行业</option>
              <option value="tech">科技</option>
              <option value="finance">金融</option>
              <option value="education">教育</option>
              <option value="health">健康</option>
              <option value="ecommerce">电商</option>
              <option value="travel">旅游</option>
              <option value="other">其他</option>
            </select>
          </div>
          
          {/* 标签管理 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              标签
            </label>
            <div className="flex items-center mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="添加标签"
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
              />
              <button
                onClick={handleAddTag}
                className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600"
              >
                添加
              </button>
            </div>
            
            {/* 已添加的标签 */}
            <div className="flex flex-wrap gap-2 mt-2">
              {siteConfig.tags.map((tag, index) => (
                <div key={index} className="bg-gray-100 px-3 py-1 rounded-full flex items-center">
                  <span className="text-sm">{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-gray-500 hover:text-gray-700"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {siteConfig.tags.length === 0 && (
                <span className="text-sm text-gray-500">暂无标签</span>
              )}
            </div>
          </div>
        </div>
        
        {/* 保存按钮 */}
        <div className="mt-6 flex items-center">
          <button
            onClick={handleSave}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
          >
            保存设置
          </button>
          
          {saveStatus && (
            <span className={`ml-3 text-sm ${saveStatus === '保存成功' ? 'text-green-500' : 'text-red-500'}`}>
              {saveStatus}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <StrictMode>
    <Options />
  </StrictMode>
);

export default Options; 