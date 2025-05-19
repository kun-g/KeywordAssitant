/**
 * 子域名/子文件夹数据抓取脚本
 * 
 * 该脚本用于在 sem.3ue.co 网站上抓取子域名/子文件夹数据
 */

import { SubdomainData, SubdomainDataFetchedMessage } from './types';

// 调试日志功能
const DEBUG = true; // 调试开关，发布时可设为false

function debugLog(...args: any[]) {
  if (DEBUG) {
    console.log('[DEBUG][KeywordAssistant]', ...args);
  }
}

// 判断当前页面是否为目标页面
const isTargetPage = (): boolean => {
  const url = window.location.href;
  const isTarget = url.includes('sem.3ue.co/analytics/traffic/subfolders-subdomains');
  debugLog('检查页面URL:', url, '是否为目标页面:', isTarget);
  return isTarget;
};

// 解析URL，判断是子域名还是子文件夹
const parseUrl = (url: string): { isSubdomain: boolean; parentDomain: string } => {
  try {
    debugLog('解析URL:', url);
    const urlObj = new URL(url);
    const hostParts = urlObj.hostname.split('.');
    
    // 如果路径长度大于1，且不是www，可能是子域名
    if (hostParts.length > 2 && hostParts[0] !== 'www') {
      const parentDomain = hostParts.slice(1).join('.');
      debugLog('识别为子域名, 父域名:', parentDomain);
      return { isSubdomain: true, parentDomain };
    }
    
    // 否则可能是子文件夹
    debugLog('识别为子文件夹, 域名:', urlObj.hostname);
    return { isSubdomain: false, parentDomain: urlObj.hostname };
  } catch (error) {
    console.error('解析URL失败:', error);
    return { isSubdomain: false, parentDomain: '' };
  }
};

// 提取表格数据
const extractTableData = (): any[] => {
  const body = document.querySelector("div[data-ui-name='DefinitionTable.Body']");
  console.log('body', !!body);
  if (!body) return [];

  const result = [];

  for (const row of body.children) {
    const domain = row.querySelector('[data-testid="text"]')?.textContent?.trim();
    const link = row.querySelector('[data-testid="page-link"]')?.getAttribute('href');
    const traffic = row.querySelector('[data-testid="entrances"]')?.textContent?.trim();
    const desktopShare = row.querySelector('[data-testid="entrancesShareDesktop"]')?.textContent?.trim();
    const mobileShare = row.querySelector('[data-testid="entrancesShareMobile"]')?.textContent?.trim();

    console.log('domain', domain);
    console.log('link', link);
    console.log('traffic', traffic);
    console.log('desktopShare', desktopShare);
    console.log('mobileShare', mobileShare);
    if (domain && link) {
      result.push({
        domain,
        link,
        traffic,
        desktopShare,
        mobileShare
      });
    }
  }

  return result;
};

// 抓取子域名/子文件夹数据
const scrapeSubdomains = (): SubdomainData[] => {
  try {
    if (!isTargetPage()) {
      console.warn('当前页面不是子域名/子文件夹数据页面');
      return [];
    }
    
    debugLog('开始抓取子域名/子文件夹数据');
    const subdomains = extractTableData();
    debugLog(`抓取到 ${subdomains.length} 条子域名/子文件夹数据`);
    return subdomains;
  } catch (error) {
    console.error('抓取子域名/子文件夹数据失败:', error);
    return [];
  }
};

// 自动抓取数据
const autoScrape = () => {
  if (!isTargetPage()) {
    return;
  }
  
  debugLog('检测到子域名/子文件夹页面，准备抓取数据...');
  
  // 等待页面加载完成
  setTimeout(() => {
    debugLog('页面加载等待结束，开始抓取数据');
    const subdomains = scrapeSubdomains();
    
      console.log('XXXsubdomains', subdomains);
    if (subdomains.length > 0) {
      debugLog(`准备发送 ${subdomains.length} 条数据到后台`);
      console.log('subdomains', subdomains);
      // 发送数据到后台脚本
      chrome.runtime.sendMessage({
        action: 'subdomain_data_fetched',
        data: subdomains
      } as SubdomainDataFetchedMessage, (response) => {
        if (chrome.runtime.lastError) {
          console.error('发送数据失败:', chrome.runtime.lastError);
          debugLog('发送数据失败:', chrome.runtime.lastError);
          return;
        }
        
        debugLog('收到后台响应:', response);
        if (response && response.success) {
          console.log(`成功保存 ${response.count} 条子域名/子文件夹数据`);
          debugLog(`成功保存 ${response.count} 条子域名/子文件夹数据`);
          
          // 显示成功提示
          const notification = document.createElement('div');
          notification.style.position = 'fixed';
          notification.style.top = '20px';
          notification.style.right = '20px';
          notification.style.backgroundColor = '#4CAF50';
          notification.style.color = 'white';
          notification.style.padding = '15px';
          notification.style.borderRadius = '5px';
          notification.style.zIndex = '9999';
          notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
          notification.textContent = `成功抓取并保存 ${response.count} 条子域名/子文件夹数据`;
          
          document.body.appendChild(notification);
          debugLog('添加成功通知到页面');
          
          // 3秒后移除通知
          setTimeout(() => {
            document.body.removeChild(notification);
            debugLog('移除成功通知');
          }, 3000);
        } else {
          console.error('保存数据失败:', response?.error || '未知错误');
          debugLog('保存数据失败:', response?.error || '未知错误');
        }
      });
    } else {
      debugLog('未抓取到数据，不发送消息');
    }
  }, 3000); // 等待3秒，确保页面加载完成
};

// 监听来自popup的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  debugLog('收到消息:', message);
  if (message.action === 'manual_scrape_subdomains') {
    debugLog('收到手动抓取指令');
    if (!isTargetPage()) {
      debugLog('不是目标页面，返回错误');
      sendResponse({ success: false, error: '当前页面不是子域名/子文件夹数据页面' });
      return;
    }
    
    debugLog('开始手动抓取数据');
    const subdomains = scrapeSubdomains();
    
    if (subdomains.length > 0) {
      debugLog(`准备发送 ${subdomains.length} 条手动抓取的数据到后台`);
      // 发送数据到后台脚本
      chrome.runtime.sendMessage({
        action: 'subdomain_data_fetched',
        data: subdomains
      } as SubdomainDataFetchedMessage, (response) => {
        if (chrome.runtime.lastError) {
          debugLog('发送数据失败:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message || '发送数据失败' });
          return;
        }
        
        debugLog('收到后台响应:', response);
        if (response && response.success) {
          debugLog(`手动抓取成功，发送成功响应，数量: ${subdomains.length}`);
          sendResponse({ success: true, count: subdomains.length });
        } else {
          debugLog('后台处理失败:', response?.error);
          sendResponse({ success: false, error: response?.error || '保存数据失败' });
        }
      });
      return true; // 异步响应
    } else {
      debugLog('未抓取到数据，返回错误');
      sendResponse({ success: false, error: '未找到子域名/子文件夹数据' });
    }
  }
  
  return false;
});

// 页面加载完成后自动抓取
window.addEventListener('load', () => {
  debugLog('页面加载完成，调用autoScrape');
  autoScrape();
});

// 导出函数，方便测试
export { scrapeSubdomains, extractTableData, parseUrl, isTargetPage }; 