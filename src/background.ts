// KeywordAssistant - 后台服务脚本
import { KeywordData, MessagePayload, SubdomainData } from './types';
import { addSubdomainsBatch } from './utils/storage';

// 调试日志功能
const DEBUG = true; // 调试开关，发布时可设为false

function debugLog(...args: any[]) {
  if (DEBUG) {
    console.log('[DEBUG][BackgroundScript]', ...args);
  }
}

// 初始化存储
const initStorage = async () => {
  const defaultStorage = {
    backlinks: [],
    site_config: {
      name: '',
      domain: '',
      tags: [],
      industry: ''
    },
    keywords: [],
    subdomains: []
  };

  try {
    debugLog('开始初始化存储...');
    const { backlinks } = await chrome.storage.local.get('backlinks');
    const { site_config } = await chrome.storage.local.get('site_config');
    const { keywords } = await chrome.storage.local.get('keywords');
    const { subdomains } = await chrome.storage.local.get('subdomains');

    if (!backlinks) {
      await chrome.storage.local.set({ backlinks: defaultStorage.backlinks });
      debugLog('初始化backlinks存储');
    }

    if (!site_config) {
      await chrome.storage.local.set({ site_config: defaultStorage.site_config });
      debugLog('初始化site_config存储');
    }

    if (!keywords) {
      await chrome.storage.local.set({ keywords: defaultStorage.keywords });
      debugLog('初始化keywords存储');
    }

    if (!subdomains) {
      await chrome.storage.local.set({ subdomains: defaultStorage.subdomains });
      debugLog('初始化subdomains存储');
    }

    console.log('KeywordAssistant 插件存储已初始化');
    debugLog('存储初始化完成');
  } catch (error) {
    console.error('KeywordAssistant 插件存储初始化失败:', error);
    debugLog('存储初始化失败:', error);
  }
};

// 监听来自内容脚本的消息
chrome.runtime.onMessage.addListener((message: MessagePayload, sender, sendResponse) => {
  debugLog('收到消息:', message, '来源:', sender);
  
  // 处理关键词数据
  if (message.action === 'keyword_data_fetched') {
    debugLog('收到关键词数据:', message.data);
    // 将关键词数据保存到存储中
    handleKeywordData(message.data as KeywordData)
      .then(() => {
        debugLog('关键词数据处理成功');
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error('处理关键词数据失败:', error);
        debugLog('关键词数据处理失败:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 异步响应
  }
  
  // 处理子域名/子文件夹数据
  if (message.action === 'subdomain_data_fetched') {
    debugLog('收到子域名数据:', message.data);
    // 将子域名/子文件夹数据保存到存储中
    handleSubdomainData(message.data as SubdomainData[])
      .then((count) => {
        debugLog('子域名数据处理成功, 数量:', count);
        sendResponse({ success: true, count });
      })
      .catch((error) => {
        console.error('处理子域名/子文件夹数据失败:', error);
        debugLog('子域名数据处理失败:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 异步响应
  }
  
  // 获取所有子域名/子文件夹数据
  if (message.action === 'get_all_subdomains') {
    debugLog('收到获取所有子域名数据请求');
    getAllSubdomains()
      .then((data) => {
        debugLog('成功获取子域名数据, 数量:', data.length);
        sendResponse({ success: true, data });
      })
      .catch((error) => {
        console.error('获取子域名/子文件夹数据失败:', error);
        debugLog('获取子域名数据失败:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // 异步响应
  }
  
  debugLog('未处理的消息类型:', message.action);
});

// 处理关键词数据
const handleKeywordData = async (keywordData: KeywordData): Promise<void> => {
  try {
    debugLog('处理关键词数据:', keywordData.keyword);
    // 获取现有关键词数据
    const { keywords = [] } = await chrome.storage.local.get('keywords');
    
    // 检查是否已存在相同关键词的数据
    const existingIndex = keywords.findIndex((item: KeywordData) => 
      item.keyword === keywordData.keyword && item.platform === keywordData.platform
    );
    
    if (existingIndex >= 0) {
      // 更新现有数据
      debugLog('更新现有关键词数据');
      keywords[existingIndex] = keywordData;
    } else {
      // 添加新数据
      debugLog('添加新关键词数据');
      keywords.push(keywordData);
    }
    
    // 保存更新后的数据
    await chrome.storage.local.set({ keywords });
    
    console.log('关键词数据已保存:', keywordData.keyword);
    debugLog('关键词数据已保存成功');
  } catch (error) {
    console.error('保存关键词数据失败:', error);
    debugLog('保存关键词数据失败:', error);
    throw error;
  }
};

// 处理子域名/子文件夹数据
const handleSubdomainData = async (subdomainData: SubdomainData[]): Promise<number> => {
  try {
    debugLog(`处理${subdomainData.length}条子域名数据`);
    // 将数据批量添加到存储中
    const result = await addSubdomainsBatch(subdomainData);
    debugLog('子域名数据处理结果:', result);
    return subdomainData.length;
  } catch (error) {
    console.error('保存子域名/子文件夹数据失败:', error);
    debugLog('保存子域名数据失败:', error);
    throw error;
  }
};

// 获取所有子域名/子文件夹数据
const getAllSubdomains = async (): Promise<SubdomainData[]> => {
  try {
    debugLog('获取所有子域名数据');
    const { subdomains = [] } = await chrome.storage.local.get('subdomains');
    debugLog(`获取到${subdomains.length}条子域名数据`);
    return subdomains;
  } catch (error) {
    console.error('获取子域名/子文件夹数据失败:', error);
    debugLog('获取子域名数据失败:', error);
    throw error;
  }
};

// 插件安装或更新时初始化存储
chrome.runtime.onInstalled.addListener(() => {
  debugLog('插件已安装或更新，初始化存储');
  initStorage();
});

console.log('KeywordAssistant 背景服务已启动');
debugLog('背景服务已启动'); 