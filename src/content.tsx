// KeywordAssistant - 内容脚本
// 负责在目标外链页面执行评论提交操作

import { MessagePayload, Sim3ueKeywordData, SumrushKeywordData } from './types/index';

// React导入放在条件语句外，确保编译时可用
// React自动导入by jsxInject
import ReactDOM from 'react-dom/client';

// 判断页面平台类型
function detectPlatform() {
  const html = document.documentElement.innerHTML;
  console.log('KeywordAssistant: 当前页面URL:', window.location.hostname);
  if (window.location.hostname.includes('ahrefs')) {
    return 'ahrefs';
  } else if (window.location.hostname.includes('sim.3ue.co')) {
    return 'sim3ue';
  } else if (window.location.hostname.includes('sem.3ue.co')) {
    return 'sumrush';
  } else {
    return 'unknown';
  }
}

// 从URL中提取关键词
const extractKeywordFromUrl = (): string | null => {
  try {
    const url = new URL(window.location.href);
    
    // sumrush 平台关键词在 query string 的 q 参数
    if (url.hostname.includes('sem.3ue.co') && url.searchParams.has('q')) {
      return decodeURIComponent(url.searchParams.get('q') || '');
    }
    
    // sim3ue 旧逻辑
    if (url.hash.includes('keyword=')) {
      // 从URL hash部分提取关键词参数
      const keywordMatch = url.hash.match(/keyword=([^&]+)/);
      if (keywordMatch && keywordMatch[1]) {
        // 解码URL编码的关键词
        return decodeURIComponent(keywordMatch[1]);
      }
    }
    return null;
  } catch (error) {
    console.error('KeywordAssistant: 解析URL失败', error);
    return null;
  }
};

// 抓取页面上的关键词数据
const fetchKeywordData = async () => {
  try {
    // 针对sim3ue平台
    if (detectPlatform() === 'sim3ue') {
      const keyword = extractKeywordFromUrl();
      if (!keyword) {
        throw new Error('无法从URL中提取关键词');
      }

      // 使用可靠的DataValue-类选择器获取数据
      const volumeClicksContainer = document.querySelector('div[data-automation="VolumeAndClicks"] > div');
      const dataValueElements = volumeClicksContainer?.querySelectorAll('div[class*="DataValue-"]');
      
      // 获取设备分布数据
      const deviceDistributionContainer = document.querySelector('div[data-automation="DeviceDistribution"]');
      const deviceLabels = deviceDistributionContainer?.querySelectorAll('div[data-automation="non-selectable-legend-label-value"]');
      
      // 获取动态趋势图表
      const trendOverTimeContainer = document.querySelector('div[class*="TrendOverTimeWrapper"]');
      const trendChart = trendOverTimeContainer?.querySelector('svg.highcharts-root');
      let trendChartUrl = '';
      let trendChartBase64 = '';
      
      if (trendChart) {
        try {
          // 将SVG转换为字符串
          const svgData = new XMLSerializer().serializeToString(trendChart);
          
          // 1. 创建Blob URL用于插件内展示（性能更好）
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          trendChartUrl = URL.createObjectURL(svgBlob);
          
          // 2. 同时创建base64编码用于JSON导出
          // 添加SVG XML命名空间以确保正确渲染
          const svgString = svgData.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
          // 使用base64编码SVG数据创建Data URL
          const base64 = btoa(unescape(encodeURIComponent(svgString)));
          trendChartBase64 = `data:image/svg+xml;base64,${base64}`;
        } catch (e) {
          console.error('无法创建趋势图URL:', e);
        }
      }
      
      // 获取相关关键词
      const keywordsIdeasContainer = document.querySelector('div[data-automation="KeywordsIdeas"]');
      let relatedKeywords: Array<{keyword: string, volume: string, clickThroughRate: string, kd: string}> = [];
      
      if (keywordsIdeasContainer) {
        const keywordCells = keywordsIdeasContainer.querySelectorAll('[data-table-row][data-table-col]');
        const rowMap = new Map<number, any>();
        
        keywordCells.forEach(cell => {
          const row = Number(cell.getAttribute('data-table-row'));
          const col = Number(cell.getAttribute('data-table-col'));
        
          if (!rowMap.has(row)) rowMap.set(row, {});
          const rowData = rowMap.get(row);
        
          switch (col) {
            case 0: // keyword
              rowData.keyword = cell.querySelector('a')?.textContent?.trim() || '未知';
              break;
            case 1: // volume
              rowData.volume = cell.textContent?.trim() || '未知';
              break;
            case 5: // clickThroughRate
              rowData.clickThroughRate = cell.textContent?.trim() || '未知';
              break;
            case 6: // kd
              rowData.kd = cell.textContent?.trim() || '未知';
              break;
            // 其他列你可按需添加
          }
        });
        
        relatedKeywords = Array.from(rowMap.values());
      }
      
      // 获取头部网站数据
      const topCompetitorsContainer = document.querySelector('div[data-automation="TopCompetitors"]');
      let topCompetitors: Array<{website: string, clicks: string}> = [];
      
      if (topCompetitorsContainer) {
        const cells = topCompetitorsContainer.querySelectorAll('[data-table-row][data-table-col]');
        const rowMap = new Map<number, any>();

        cells.forEach(cell => {
          const row = Number(cell.getAttribute('data-table-row'));
          const col = Number(cell.getAttribute('data-table-col'));

          if (!rowMap.has(row)) rowMap.set(row, {});
          const rowData = rowMap.get(row);

          switch (col) {
            case 0: // website
              rowData.website = cell.querySelector('a')?.textContent?.trim() || '未知';
              break;
            case 1: // clicks
              rowData.clicks = cell.querySelector('div[class*="ClicksTrendValueContainer"]')?.textContent?.trim() || '未知';
              break;
            // 其他列你可按需添加
          }
        });
        topCompetitors = Array.from(rowMap.values());
      }
      
      // 从页面上提取数据，符合Sim3ueKeywordData类型
      const dataPoints: Sim3ueKeywordData = {
        keyword,
        // 使用DataValue-类选择器获取volume、clicks和clickThroughRate
        volume: dataValueElements?.[0]?.textContent?.trim() || '未知',
        clicks: dataValueElements?.[1]?.textContent?.trim() || '未知',
        clickThroughRate: dataValueElements?.[2]?.textContent?.trim() || '未知',
        difficulty: document.querySelector('[id*="难度"] + div')?.textContent?.trim() || '未知',
        // 设备分布
        devices: {
          desktop: deviceLabels?.[0]?.textContent?.trim() || '未知',
          mobile: deviceLabels?.[1]?.textContent?.trim() || '未知'
        },
        // 动态趋势
        trends: {
          chartUrl: trendChartUrl,
          chartBase64: trendChartBase64
        },
        // 相关关键词
        relatedKeywords,
        // 头部网站
        topCompetitors,
        // 记录数据来源平台
        platform: 'sim3ue',
        // 记录抓取时间
        captured_at: Date.now()
      };
      
      return dataPoints;
    } 
    // 针对sumrush平台
    else if (detectPlatform() === 'sumrush') {
      const keyword = extractKeywordFromUrl();
      if (!keyword) {
        throw new Error('无法从URL中提取关键词');
      }

      // 1. 抓取搜索量 - 根据用户提供的HTML更新选择器
      const volumeElem = document.querySelector('span.kwo-widget-total[data-testid="volume-total"]');
      
      // 提取区域/国家信息
      const regionElem = document.querySelector('div[data-testid="database-selector"] .___SText_cbs87-ko_');
      const regionCode = document.querySelector('div[data-testid="database-selector"]')?.getAttribute('value') || '';
      
      // 2. 抓取关键词难度/竞争度 - 只存储整数值
      const difficultyElem = document.querySelector('.kwo-kd__metric');
      let difficultyValue = 0;
      
      if (difficultyElem) {
        const difficultyText = difficultyElem.textContent?.trim() || '';
        // 尝试提取百分比中的数字部分，例如从 "48%" 提取 48
        const difficultyMatch = difficultyText.match(/(\d+)/);
        if (difficultyMatch && difficultyMatch[1]) {
          difficultyValue = parseInt(difficultyMatch[1], 10);
        }
      }
      
      // 3. 国家/地区分布数据 - 更精确地抓取并存储按国家的数据
      const countryDistribution: Record<string, string> = {};
      
      // 获取所有国家项
      const countryItems = document.querySelectorAll('.___SItem_1q27i-ko_');
      
      countryItems.forEach(item => {
        try {
          // 尝试获取国家代码
          const flagElem = item.querySelector('.flag-4_29_0');
          if (!flagElem) return;
          
          const flagClassList = flagElem.className.split(' ');
          const flagClass = flagClassList.find(cls => cls.startsWith('flag-') && cls.endsWith('-4_29_0'));
          if (!flagClass) return;
          
          // 从类名中提取国家代码 (形如 flag-united-states-4_29_0)
          const countryCodeMatch = flagClass.match(/flag-([\w-]+)-4_29_0/);
          if (!countryCodeMatch || !countryCodeMatch[1]) return;
          
          const countryCode = countryCodeMatch[1];
          
          // 获取国家名称和搜索量
          const countryName = item.querySelector('.___SText_cbs87-ko_')?.textContent?.trim() || countryCode;
          
          // 搜索量通常在最后一个元素中
          const volumeText = item.lastElementChild?.textContent?.trim() || '0';
          
          // 将国家代码作为键，搜索量作为值存储
          countryDistribution[countryCode] = volumeText;
        } catch (e) {
          console.error('解析国家数据失败:', e);
        }
      });

      // 4. 趋势图（SVG）- 尝试找到趋势图表
      const trendChart = document.querySelector('.kwo-trends-chart svg');
      let trendChartUrl = '';
      let trendChartBase64 = '';
      
      if (trendChart) {
        try {
          // 将SVG转换为字符串
          const svgData = new XMLSerializer().serializeToString(trendChart);
          
          // 创建Blob URL用于插件内展示
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          trendChartUrl = URL.createObjectURL(svgBlob);
          
          // 创建base64编码用于JSON导出
          const svgString = svgData.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
          const base64 = btoa(unescape(encodeURIComponent(svgString)));
          trendChartBase64 = `data:image/svg+xml;base64,${base64}`;
        } catch (e) {
          console.error('无法创建趋势图URL:', e);
        }
      }

      // 5. 相关关键词
      let relatedKeywords: Array<{keyword: string, volume: string, difficulty: number}> = [];
      const relatedKeywordsTable = document.querySelector('.kwo-related-keywords-table');
      
      if (relatedKeywordsTable) {
        const rows = relatedKeywordsTable.querySelectorAll('tbody tr');
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length >= 3) {
            // 尝试将难度转换为整数
            let kd = 0;
            const kdText = cells[2]?.textContent?.trim() || '';
            const kdMatch = kdText.match(/(\d+)/);
            if (kdMatch && kdMatch[1]) {
              kd = parseInt(kdMatch[1], 10);
            }
            
            relatedKeywords.push({
              keyword: cells[0]?.textContent?.trim() || '未知',
              volume: cells[1]?.textContent?.trim() || '未知',
              difficulty: kd
            });
          }
        });
      }

      // 6. 头部网站/竞争对手
      let topCompetitors: Array<{website: string, traffic: string}> = [];
      const competitorsTable = document.querySelector('.kwo-serp-table');
      
      if (competitorsTable) {
        const rows = competitorsTable.querySelectorAll('tbody tr');
        rows.forEach(row => {
          const domainCell = row.querySelector('td.kwo-serp-table__domain');
          const trafficCell = row.querySelector('td.kwo-serp-table__traffic');
          
          if (domainCell && trafficCell) {
            topCompetitors.push({
              website: domainCell.textContent?.trim() || '未知',
              traffic: trafficCell.textContent?.trim() || '未知',
            });
          }
        });
      }

      // 组装数据 - 符合SumrushKeywordData类型
      const dataPoints: SumrushKeywordData = {
        keyword,
        volume: volumeElem?.textContent?.trim() || '未知',
        region: {
          code: regionCode,
          name: regionElem?.textContent?.trim() || '未知'
        },
        // 仅存储整数难度值
        difficulty: difficultyValue,
        // 按国家的搜索量分布
        countryDistribution,
        // 动态趋势
        trends: {
          chartUrl: trendChartUrl,
          chartBase64: trendChartBase64
        },
        // 相关关键词
        relatedKeywords,
        // 头部网站
        topCompetitors,
        // 记录数据来源平台
        platform: 'sumrush',
        // 记录抓取时间
        captured_at: Date.now(),
        // 记录来源URL
        source_url: window.location.href
      };
      
      return dataPoints;
    }
    
    // 其他平台
    return { 
      message: '当前仅支持Sim3ue和Sumrush平台',
      platform: detectPlatform(),
      keyword: extractKeywordFromUrl() || '未知',
      captured_at: Date.now()
    };
  } catch (error) {
    console.error('抓取关键词数据时出错:', error);
    throw error;
  }
};

// 监听来自Background的消息
chrome.runtime.onMessage.addListener((message: MessagePayload, _sender, sendResponse) => {
  console.log('KeywordAssistant Content Script: 接收到消息', message);

  if (message.action === 'submit_comment') {
    // 简化版本，仅用于开发测试
    chrome.runtime.sendMessage({
      action: 'link_submitted',
      data: {
        id: message.data.id,
        success: true
      }
    });
    
    sendResponse({ success: true });
    return true; // 指示异步响应
  }
  
  if (message.action === 'get_platform') {
    // 返回当前检测到的平台类型
    const platform = detectPlatform();
    console.log('KeywordAssistant: 检测到平台类型:', platform);
    sendResponse({ 
      success: true, 
      platform 
    });
    return true; // 指示异步响应
  }
  
  if (message.action === 'get_keyword') {
    // 返回从URL提取的关键词
    const keyword = extractKeywordFromUrl();
    console.log('KeywordAssistant: 提取到关键词:', keyword);
    sendResponse({ 
      success: true, 
      keyword 
    });
    return true; // 指示异步响应
  }
  
  if (message.action === 'fetch_keyword_data') {
    // 执行关键词数据抓取
    fetchKeywordData()
      .then(data => {
        console.log('KeywordAssistant: 关键词数据抓取成功:', data);
        sendResponse({ 
          success: true, 
          data 
        });
      })
      .catch(error => {
        console.error('KeywordAssistant: 关键词数据抓取失败:', error);
        sendResponse({ 
          success: false, 
          error: error.message || '抓取失败' 
        });
      });
    return true; // 指示异步响应
  }
});

// 页面加载完成后执行
window.addEventListener('load', () => {
  const platform = detectPlatform();
  console.log('KeywordAssistant 内容脚本已加载, 平台类型:', platform);
  
  // 仅检测平台和关键词，不再注入UI组件
  if (platform === 'sim3ue' || platform === 'ahrefs' || platform === 'sumrush') {
    console.log(`KeywordAssistant: 检测到${platform}平台，尝试提取关键词`);
    const keyword = extractKeywordFromUrl();
    if (keyword) {
      console.log('KeywordAssistant: 检测到关键词:', keyword);
    }
  } else {
    console.log('KeywordAssistant: 不支持当前平台:', platform);
  }
});

// 为了确保TypeScript编译通过
export {}; 