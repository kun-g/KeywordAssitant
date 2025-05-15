# LinkPilot 插件系统架构说明文档

---

## 一、总体架构概览

LinkPilot 插件基于 Chrome MV3 插件架构开发，主要由以下五个逻辑模块组成：

```plaintext
┌───────────────────────────────┐
│         插件主进程（background.js）      │
├───────────────────────────────┤
│ - 管理任务调度与状态           │
│ - 执行外链提交自动化脚本       │
│ - 与 content script 通信        │
└───────────────────────────────┘
        ▲               ▲
        │               │
        ▼               ▼
┌──────────────┐     ┌────────────────────┐
│ popup.html + JS │     │ content_script.js        │
│ 主界面交互      │     │ 注入目标页面，识别表单入口 │
│ 采集 / 管理 / 提交 │     │ 执行表单填充与提交动作     │
└──────────────┘     └────────────────────┘
        ▲
        │
        ▼
┌────────────────────┐
│ options.html + JS       │
│ 设置站点 / 模型 / 权限等配置 │
└────────────────────┘
        ▲
        │
        ▼
┌────────────────────┐
│ local_storage / JSON │
│ 存储所有外链数据与状态    │
└────────────────────┘
```

---

## 二、模块职责分工

### 2.1 `background.js`

* **调度控制中心**：协调页面内容注入与任务执行流程
* **任务状态管理**：追踪提交任务的成功 / 失败 / 重试状态
* **跨模块通信**：接收 popup 发起的提交任务，转发到 content script
* **自动提交执行器**：控制浏览器标签打开、注入、执行并监听结果

### 2.2 `popup.html + popup.js`

* **展示主操作界面**：外链列表、筛选器、按钮操作入口
* **发起操作请求**：采集、提交、标记等动作的统一入口
* **数据读写**：读取 localStorage 中的数据，更新 UI 状态

### 2.3 `options.html + options.js`

* **站点信息设置**：多站点资料配置（名称、主域、标签）
* **模型参数管理**：GPT API Key、模型偏好、评论风格等
* **插件权限提示**：显示 `<all_urls>` 权限状态及配置建议
* **数据导入导出入口**：管理 CSV / JSON 文件交互

### 2.4 `content_script.js`

* **注入外链目标页面**：自动识别是否为支持平台（如 WordPress）
* **DOM 操作与表单识别**：识别输入框、评论区、提交按钮
* **自动填写并执行提交**：将 GPT 生成评论填入并提交
* **回传处理结果**：包括是否成功提交、失败原因等

### 2.5 `localStorage`（或 JSON 文件）

* **存储结构：**

```json
{
  "backlinks": [
    {
      "source_url": "https://abc.com",
      "anchor": "YourSite",
      "target_url": "https://yourdomain.com",
      "type": "blog",
      "platform": "wordpress",
      "nofollow": false,
      "status": "submitted",
      "comment": "This article is great because...",
      "error": null
    },
    ...
  ],
  "site_config": {
    "name": "MySite",
    "domain": "yourdomain.com",
    "tags": ["tech"],
    "industry": "B2B"
  }
}
```

---

## 三、关键通信机制

### Background 与 Popup

* 通过 `chrome.runtime.sendMessage` 进行任务请求与响应：

```js
chrome.runtime.sendMessage({ action: 'submit_link', payload })
```

### Background 与 Content Script

* 插件打开目标外链页面后，使用 `chrome.scripting.executeScript` 注入逻辑：

```js
chrome.scripting.executeScript({
  target: { tabId },
  func: injectedSubmitFunction,
  args: [comment, config]
})
```

### 数据持久化（Popup / Options）

* 使用 `chrome.storage.local` 或 fallback 为 `localStorage`
* 读取 / 写入同步状态、评论内容、标签等信息

---

## 四、后续可扩展架构预留

| 扩展功能       | 架构预留方式                                 |
| ---------- | -------------------------------------- |
| 远程同步存储     | 使用 Supabase / Firebase 替代 localStorage |
| 多人协作任务管理   | 插件与 Web Dashboard 同步任务状态               |
| 自定义平台提交规则库 | 规则以 JSON 存储，后台可手动配置并匹配                 |
| 规则学习（低代码）  | 用录制用户交互行为形成 DOM 提交流程模板                 |

---
