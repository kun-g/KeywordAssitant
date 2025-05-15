// KeywordAssistant - 后台服务脚本
import { KeywordData, MessagePayload } from './types';

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
    keywords: []
  };

  try {
    const { backlinks } = await chrome.storage.local.get('backlinks');
    const { site_config } = await chrome.storage.local.get('site_config');
    const { keywords } = await chrome.storage.local.get('keywords');

    if (!backlinks) {
      await chrome.storage.local.set({ backlinks: defaultStorage.backlinks });
    }

    if (!site_config) {
      await chrome.storage.local.set({ site_config: defaultStorage.site_config });
    }

    if (!keywords) {
      await chrome.storage.local.set({ keywords: defaultStorage.keywords });
    }

    console.log('KeywordAssistant 插件存储已初始化');
  } catch (error) {
    console.error('KeywordAssistant 插件存储初始化失败:', error);
  }
};

// 保存关键词数据
const saveKeywordData = async (keywordData: KeywordData): Promise<boolean> => {
  try {
    // 添加时间戳
    const enrichedData = {
      ...keywordData,
      captured_at: Date.now(),
      source_url: keywordData.source_url || window.location.href
    };

    // 获取现有关键词数据
    const { keywords = [] } = await chrome.storage.local.get('keywords');
    
    // 检查是否已存在相同关键词数据
    const existingIndex = keywords.findIndex(
      (k: KeywordData) => k.keyword === keywordData.keyword
    );
    
    if (existingIndex >= 0) {
      // 更新现有数据
      keywords[existingIndex] = enrichedData;
    } else {
      // 添加新数据
      keywords.push(enrichedData);
    }
    
    // 保存到本地存储
    await chrome.storage.local.set({ keywords });
    console.log('关键词数据已保存:', enrichedData);
    
    return true;
  } catch (error) {
    console.error('保存关键词数据失败:', error);
    return false;
  }
};

// 监听来自popup或content scripts的消息
chrome.runtime.onMessage.addListener((message: MessagePayload, _sender, sendResponse) => {
  console.log('接收到消息:', message);

  switch (message.action) {
    case 'submit_link':
      // 简化版本，仅用于开发测试
      sendResponse({ success: true });
      return true;

    case 'link_submitted':
      // 简化版本，仅用于开发测试
      console.log('链接提交结果:', message.data);
      sendResponse({ success: true });
      return true;
      
    case 'keyword_data_fetched':
      // 处理从内容脚本获取的关键词数据
      saveKeywordData(message.data)
        .then(success => {
          sendResponse({ success });
        })
        .catch(error => {
          console.error('保存关键词数据时出错:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // 异步响应

    case 'get_all_keywords':
      // 获取所有已保存的关键词数据
      chrome.storage.local.get('keywords')
        .then(({ keywords = [] }) => {
          sendResponse({ success: true, data: keywords });
        })
        .catch(error => {
          console.error('获取关键词数据失败:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // 异步响应

    default:
      console.log('未知操作:', message.action);
      sendResponse({ success: false, error: '未知操作' });
  }
});

// 插件安装或更新时初始化存储
chrome.runtime.onInstalled.addListener(() => {
  initStorage();
});

console.log('KeywordAssistant 背景服务已启动'); 