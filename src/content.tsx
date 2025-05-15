// LinkPilot - 内容脚本
// 负责在目标外链页面执行评论提交操作

import { MessagePayload } from './types';

// React导入放在条件语句外，确保编译时可用
// React自动导入by jsxInject
import ReactDOM from 'react-dom/client';

// 开发环境变量
const isDevelopment = false; // 构建时会被替换

// 判断页面平台类型
function detectPlatform() {
  const html = document.documentElement.innerHTML;
  if (html.includes('wp-content') || html.includes('wordpress')) {
    return 'wordpress';
  } else if (html.includes('disqus')) {
    return 'disqus';
  } else {
    return 'unknown';
  }
}

// 查找评论表单
const findCommentForm = (): HTMLFormElement | null => {
  const platform = detectPlatform();

  if (platform === 'wordpress') {
    return document.getElementById('commentform') as HTMLFormElement;
  } else if (platform === 'disqus') {
    return document.querySelector('.textarea-wrapper') as HTMLFormElement;
  } else {
    // 尝试通用评论表单识别
    const forms = Array.from(document.querySelectorAll('form'));
    return forms.find(form => {
      const text = form.textContent?.toLowerCase() || '';
      return (
        text.includes('comment') || 
        text.includes('留言') || 
        text.includes('评论')
      );
    }) || null;
  }
};

// 填写并提交评论
const submitComment = async (id: string, comment: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const form = findCommentForm();
    
    if (!form) {
      return { 
        success: false, 
        error: '无法找到评论表单' 
      };
    }

    const platform = detectPlatform();
    let commentField: HTMLTextAreaElement | HTMLInputElement | null = null;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let submitButton: HTMLButtonElement | HTMLInputElement | null = null;

    // 查找评论字段和提交按钮
    if (platform === 'wordpress') {
      commentField = document.getElementById('comment') as HTMLTextAreaElement;
      submitButton = form.querySelector('input[type="submit"]') as HTMLInputElement;
    } else if (platform === 'disqus') {
      commentField = document.querySelector('.textarea') as HTMLTextAreaElement;
      submitButton = document.querySelector('.btn-primary') as HTMLButtonElement;
    } else {
      // 通用表单识别
      commentField = form.querySelector('textarea') as HTMLTextAreaElement;
      submitButton = form.querySelector('button[type="submit"], input[type="submit"]') as HTMLButtonElement;
    }

    if (!commentField) {
      return { 
        success: false, 
        error: '无法找到评论输入框' 
      };
    }

    // 使用事件模拟用户输入
    const setNativeValue = (element: HTMLTextAreaElement | HTMLInputElement, value: string) => {
      const valueSetter = Object.getOwnPropertyDescriptor(element, 'value')?.set;
      const prototype = Object.getPrototypeOf(element);
      const prototypeValueSetter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
      
      if (valueSetter && prototypeValueSetter && valueSetter !== prototypeValueSetter) {
        prototypeValueSetter.call(element, value);
      } else {
        valueSetter?.call(element, value);
      }
      
      element.dispatchEvent(new Event('input', { bubbles: true }));
    };

    // 填写评论
    setNativeValue(commentField, comment);
    
    // 在真实提交前，先通知Background评论已提交状态
    // 注意：这里不实际提交，仅演示通信流程
    chrome.runtime.sendMessage({
      action: 'link_submitted',
      data: {
        id: id,
        success: true
      }
    });

    console.log('LinkPilot: 评论已填写，等待用户确认');
    
    // 不自动点击提交按钮，避免自动化提交被反垃圾评论系统拦截
    // 如果需要自动提交，可以取消下面注释
    /*
    if (submitButton) {
      submitButton.click();
      return { success: true };
    } else {
      return { 
        success: false, 
        error: '无法找到提交按钮' 
      };
    }
    */
    
    return { success: true };
  } catch (error) {
    console.error('LinkPilot: 提交评论失败', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : '未知错误' 
    };
  }
};

// 注入UI组件
const injectUI = () => {
  const container = document.createElement('div');
  container.id = 'linkpilot-container';
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
      title="LinkPilot已加载"
    >
      LP
    </div>
  );
};

// 监听来自Background的消息
chrome.runtime.onMessage.addListener((message: MessagePayload, _sender, sendResponse) => {
  console.log('LinkPilot Content Script: 接收到消息', message);

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
});

// 页面加载完成后执行
window.addEventListener('load', () => {
  console.log('LinkPilot 内容脚本已加载, 平台类型:', detectPlatform());
  
  // 添加可视化标记（开发模式下）
  // @ts-ignore - 这是从vite.config.ts中define注入的全局变量
  if (typeof isDevelopment !== 'undefined' && isDevelopment) {
    console.log('LinkPilot: 开发模式下启动');
    injectUI();
  }
});

// 为了确保TypeScript编译通过
export {}; 