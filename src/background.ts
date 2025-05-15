// LinkPilot - 后台服务脚本
import { MessagePayload } from './types';

// 初始化存储
const initStorage = async () => {
  const defaultStorage = {
    backlinks: [],
    site_config: {
      name: '',
      domain: '',
      tags: [],
      industry: ''
    }
  };

  try {
    const { backlinks } = await chrome.storage.local.get('backlinks');
    const { site_config } = await chrome.storage.local.get('site_config');

    if (!backlinks) {
      await chrome.storage.local.set({ backlinks: defaultStorage.backlinks });
    }

    if (!site_config) {
      await chrome.storage.local.set({ site_config: defaultStorage.site_config });
    }

    console.log('LinkPilot 插件存储已初始化');
  } catch (error) {
    console.error('LinkPilot 插件存储初始化失败:', error);
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

    default:
      console.log('未知操作:', message.action);
      sendResponse({ success: false, error: '未知操作' });
  }
});

// 插件安装或更新时初始化存储
chrome.runtime.onInstalled.addListener(() => {
  initStorage();
});

console.log('LinkPilot 背景服务已启动'); 