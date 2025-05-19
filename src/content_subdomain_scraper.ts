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
const extractTableData = (): SubdomainData[] => {
  debugLog('开始提取表格数据...');
  
  // 尝试多种选择器以适应可能的页面结构变化
  const tableSelectors = [
    "div[data-ui-name='DefinitionTable.Body']",
    ".___STable_1jxk9-ko_ tbody",
    ".___STable_1jxk9-ko_",
    ".___STableBody_1jxk9-ko_"
  ];
  
  let tableBody = null;
  for (const selector of tableSelectors) {
    tableBody = document.querySelector(selector);
    if (tableBody) {
      debugLog(`找到表格，使用选择器: ${selector}`);
      break;
    } else {
      debugLog(`选择器未匹配: ${selector}`);
    }
  }
  
  if (!tableBody) {
    debugLog('未找到表格，尝试记录页面结构');
    const bodyHTML = document.body.innerHTML.substring(0, 3000);
    debugLog('页面结构前3000个字符:', bodyHTML);
    console.error('未找到表格数据');
    // 尝试记录页面结构，帮助调试
    console.log('页面结构:', document.body.innerHTML.substring(0, 1000));
    return [];
  }

  const result: SubdomainData[] = [];
  
  // 尝试获取所有行
  // 可能是直接的子元素或者需要查找tr元素
  const rows = tableBody.querySelectorAll('tr') || Array.from(tableBody.children);
  debugLog(`找到 ${rows.length} 行数据`);
  
  if (rows.length === 0) {
    debugLog('未找到表格行，尝试获取表格单元格');
    // 尝试直接获取表格单元格
    const cells = tableBody.querySelectorAll('[data-table-col]');
    debugLog(`找到 ${cells.length} 个单元格`);
    
    if (cells.length > 0) {
      debugLog(`找到 ${cells.length} 个单元格，尝试按行组织数据`);
      
      // 按行组织数据
      const rowMap = new Map<number, any>();
      
      cells.forEach(cell => {
        const row = Number(cell.getAttribute('data-table-row') || '0');
        const col = Number(cell.getAttribute('data-table-col') || '0');
        
        if (!rowMap.has(row)) rowMap.set(row, {});
        const rowData = rowMap.get(row);
        
        // 根据列位置确定数据类型
        switch (col) {
          case 0: // 域名/路径
            rowData.domain = cell.textContent?.trim() || '';
            rowData.link = cell.querySelector('a')?.getAttribute('href') || '';
            debugLog(`行${row} 域名: ${rowData.domain}, 链接: ${rowData.link}`);
            break;
          case 1: // 流量
            rowData.traffic = cell.textContent?.trim() || '0';
            debugLog(`行${row} 流量: ${rowData.traffic}`);
            break;
          case 2: // 桌面端占比
            rowData.desktopShare = cell.textContent?.trim() || '0%';
            debugLog(`行${row} 桌面端占比: ${rowData.desktopShare}`);
            break;
          case 3: // 移动端占比
            rowData.mobileShare = cell.textContent?.trim() || '0%';
            debugLog(`行${row} 移动端占比: ${rowData.mobileShare}`);
            break;
        }
      });
      
      // 转换为SubdomainData数组
      for (const [rowIndex, data] of rowMap.entries()) {
        if (data.domain && data.link) {
          const fullLink = data.link.startsWith('http') ? data.link : `https://${data.link}`;
          const { isSubdomain, parentDomain } = parseUrl(fullLink);
          
          debugLog(`处理行${rowIndex}数据: ${data.domain}, ${fullLink}`);
          
          result.push({
            domain: data.domain,
            link: fullLink,
            traffic: data.traffic || '0',
            desktopShare: data.desktopShare || '0%',
            mobileShare: data.mobileShare || '0%',
            isSubdomain,
            parentDomain,
            created_at: Date.now(),
            updated_at: Date.now()
          });
        } else {
          debugLog(`行${rowIndex}数据不完整，跳过`);
        }
      }
      
      debugLog(`从单元格中提取了 ${result.length} 条数据`);
      return result;
    }
  }

  // 处理标准表格行
  debugLog('开始处理标准表格行');
  for (const row of Array.from(rows)) {
    // 尝试多种选择器获取数据
    const domainSelectors = ['[data-testid="text"]', 'td:first-child', '.___SText_cbs87-ko_'];
    const linkSelectors = ['[data-testid="page-link"]', 'a', 'td:first-child a'];
    const trafficSelectors = ['[data-testid="entrances"]', 'td:nth-child(2)', '.___SNumber_1jxk9-ko_'];
    const desktopSelectors = ['[data-testid="entrancesShareDesktop"]', 'td:nth-child(3)', '.___SNumber_1jxk9-ko_:nth-of-type(1)'];
    const mobileSelectors = ['[data-testid="entrancesShareMobile"]', 'td:nth-child(4)', '.___SNumber_1jxk9-ko_:nth-of-type(2)'];
    
    // 使用第一个匹配的选择器
    const findContent = (selectors: string[]) => {
      for (const selector of selectors) {
        const element = row.querySelector(selector);
        if (element) {
          debugLog(`选择器 ${selector} 匹配成功, 内容: ${element.textContent?.trim()}`);
          return element.textContent?.trim() || '';
        }
      }
      debugLog(`所有选择器 ${selectors.join(', ')} 均未匹配`);
      return '';
    };
    
    const findLink = (selectors: string[]) => {
      for (const selector of selectors) {
        const element = row.querySelector(selector);
        if (element) {
          const href = element.getAttribute('href') || '';
          debugLog(`选择器 ${selector} 匹配成功, 链接: ${href}`);
          return href;
        }
      }
      debugLog(`所有链接选择器 ${selectors.join(', ')} 均未匹配`);
      return '';
    };
    
    const domain = findContent(domainSelectors);
    const link = findLink(linkSelectors);
    const traffic = findContent(trafficSelectors) || '0';
    const desktopShare = findContent(desktopSelectors) || '0%';
    const mobileShare = findContent(mobileSelectors) || '0%';
    
    debugLog(`提取行数据: domain=${domain}, link=${link}, traffic=${traffic}`);

    if (domain && link) {
      const fullLink = link.startsWith('http') ? link : `https://${link}`;
      const { isSubdomain, parentDomain } = parseUrl(fullLink);
      
      result.push({
        domain,
        link: fullLink,
        traffic,
        desktopShare,
        mobileShare,
        isSubdomain,
        parentDomain,
        created_at: Date.now(),
        updated_at: Date.now()
      });
    } else {
      debugLog(`域名或链接为空，跳过该行: domain=${domain}, link=${link}`);
    }
  }

  debugLog(`成功提取 ${result.length} 条数据`);
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
  debugLog('autoScrape 函数被调用');
  if (!isTargetPage()) {
    debugLog('不是目标页面，跳过自动抓取');
    return;
  }
  
  debugLog('检测到子域名/子文件夹页面，准备抓取数据...');
  
  // 等待页面加载完成
  setTimeout(() => {
    debugLog('页面加载等待结束，开始抓取数据');
    const subdomains = scrapeSubdomains();
    
    if (subdomains.length > 0) {
      debugLog(`准备发送 ${subdomains.length} 条数据到后台`);
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