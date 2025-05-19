// KeywordAssistant - 内容脚本
// 负责在目标外链页面执行评论提交操作

import { MessagePayload } from './types/index';

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
const fetchKeywordData = async (): Promise<any> => {
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
      let relatedKeywords: Array<{keyword: string, volume: string, clicks: string, kd: string}> = [];
      
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
      
      // 从页面上提取数据
      const dataPoints = {
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
        topCompetitors
      };
      
      return dataPoints;
    }
    
    // 其他平台
    return { message: '当前仅支持Sim3ue平台' };
  } catch (error) {
    console.error('抓取关键词数据时出错:', error);
    throw error;
  }
};

// 渲染关键词抓取按钮
const renderKeywordFetchButton = () => {
  // 移除已存在的按钮（如果有）
  const existingContainer = document.getElementById('KeywordAssistant-keyword-container');
  if (existingContainer) {
    existingContainer.remove();
  }
  
  const container = document.createElement('div');
  container.id = 'KeywordAssistant-keyword-container';
  document.body.appendChild(container);
  
  const keyword = extractKeywordFromUrl() || '页面数据';
  const platform = detectPlatform();
  
  const root = ReactDOM.createRoot(container);
  root.render(
    <div 
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 9999,
        padding: '10px 15px',
        background: '#0079fb',
        color: 'white',
        borderRadius: '5px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
        fontSize: '14px',
        fontWeight: 'bold'
      }}
      onClick={() => {
        fetchKeywordData()
          .then(data => {
            alert(`数据已抓取成功！平台: ${platform}`);
            console.log('抓取的数据:', data);
          })
          .catch(err => {
            alert(`抓取失败: ${err.message}`);
          });
      }}
      title="抓取页面数据"
    >
      抓取{keyword !== '页面数据' ? `"${keyword}"` : '页面'}数据
    </div>
  );
};

// 注入UI组件
const injectUI = (platform: string) => {
  // 只在支持的平台上显示UI
  if (platform !== 'sim3ue' && platform !== 'ahrefs') {
    console.log('KeywordAssistant: 当前平台不支持，不显示UI:', platform);
    return;
  }

  // 移除已存在的容器(如果有)
  const existingContainer = document.getElementById('KeywordAssistant-container');
  if (existingContainer) {
    existingContainer.remove();
  }
  
  const container = document.createElement('div');
  container.id = 'KeywordAssistant-container';
  document.body.appendChild(container);
  
  const root = ReactDOM.createRoot(container);
  root.render(
    <div 
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 9999,
        padding: '10px',
        background: '#0079fb',
        color: 'white',
        borderRadius: '50%',
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
      }}
      title="KeywordAssistant已加载"
      onClick={() => renderKeywordFetchButton()}
    >
      KA
    </div>
  );
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
  
  // 添加可视化标记和抓取按钮，但只在支持的平台上显示
  if (platform === 'sim3ue' || platform === 'ahrefs') {
    console.log('KeywordAssistant: 注入UI组件');
    injectUI(platform);
  
    // 如果是Sim3ue平台，自动显示关键词抓取按钮
    if (platform === 'sim3ue') {
      console.log('KeywordAssistant: 检测到Sim3ue平台，尝试提取关键词');
      const keyword = extractKeywordFromUrl();
      if (keyword) {
        console.log('KeywordAssistant: 检测到关键词:', keyword);
        renderKeywordFetchButton();
      }
    }
  } else {
    console.log('KeywordAssistant: 不支持当前平台，不显示UI组件');
  }
});

// 为了确保TypeScript编译通过
export {}; 