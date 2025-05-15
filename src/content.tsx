// KeywordAssistant - 内容脚本
// 负责在目标外链页面执行评论提交操作

import { MessagePayload } from './types';

// React导入放在条件语句外，确保编译时可用
// React自动导入by jsxInject
import ReactDOM from 'react-dom/client';

// 判断页面平台类型
function detectPlatform() {
  const html = document.documentElement.innerHTML;
  if (window.location.hostname.includes('ahrefs')) {
    return 'ahrefs';
  } else if (window.location.hostname.includes('sim.3ue.co')) {
    return 'sim3ue';
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
      
      // 从页面上提取数据
      const dataPoints = {
        keyword,
        // 使用DataValue-类选择器获取volume、clicks和clickThroughRate
        volume: dataValueElements?.[0]?.textContent?.trim() || '未知',
        clicks: dataValueElements?.[1]?.textContent?.trim() || '未知',
        clickThroughRate: dataValueElements?.[2]?.textContent?.trim() || '未知',
        
        // SERP组成信息
        serp: {
          organic: parseFloat(document.querySelector('[title*="Classic Organic"] + div')?.textContent?.trim() || '0'),
          features: parseFloat(document.querySelector('[title*="自然 SERP 特性"] + div')?.textContent?.trim() || '0'),
          ads: parseFloat(document.querySelector('[title*="文本广告"] + div')?.textContent?.trim() || '0'),
          pla: parseFloat(document.querySelector('[title*="PLA"] + div')?.textContent?.trim() || '0')
        },
        
        // 设备分布
        devices: {
          desktop: document.querySelector('[title*="桌面端"] + div')?.textContent?.trim() || '0%',
          mobile: document.querySelector('[title*="移动网络"] + div')?.textContent?.trim() || '0%'
        },
        
        // 趋势数据 - 这通常需要更复杂的方法来获取图表数据
        // 这里仅简单获取显示的数字
        trends: {
          current: document.querySelector('[id*="规模_trend"] .current')?.textContent?.trim() || '未知',
          change: document.querySelector('[id*="规模_trend"] .change')?.textContent?.trim() || '未知'
        },
        
        // 相关关键词
        relatedKeywords: Array.from(
          document.querySelectorAll('[id*="keywordIdeas"] tr td:first-child a')
        ).map(el => (el as HTMLElement).textContent?.trim() || '')
      };

      // 发送数据到背景脚本存储
      chrome.runtime.sendMessage({
        action: 'keyword_data_fetched',
        data: dataPoints
      });

      return dataPoints;
    } 
    // 针对其他平台，可以在这里扩展不同平台的数据抓取逻辑
    else {
      const dummyData = {
        keyword: '示例关键词',
        volume: '测试数据',
        platform: detectPlatform()
      };
      
      // 发送数据到背景脚本存储
      chrome.runtime.sendMessage({
        action: 'keyword_data_fetched',
        data: dummyData
      });
      
      return dummyData;
    }
  } catch (error) {
    console.error('KeywordAssistant: 获取关键词数据失败', error);
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
const injectUI = () => {
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
  console.log('KeywordAssistant 内容脚本已加载, 平台类型:', detectPlatform());
  
  // 添加可视化标记和抓取按钮
  console.log('KeywordAssistant: 注入UI组件');
  injectUI();
  
  // 如果是Sim3ue平台，自动显示关键词抓取按钮
  if (detectPlatform() === 'sim3ue') {
    console.log('KeywordAssistant: 检测到Sim3ue平台，尝试提取关键词');
    const keyword = extractKeywordFromUrl();
    if (keyword) {
      console.log('KeywordAssistant: 检测到关键词:', keyword);
      renderKeywordFetchButton();
    }
  }
});

// 为了确保TypeScript编译通过
export {}; 