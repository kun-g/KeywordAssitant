# LinkPilot 插件 API / 模块接口说明文档

---

## 一、说明

本文件定义 LinkPilot 插件内部的主要模块接口，涵盖：

* 数据处理模块
* 任务调度模块
* 内容注入模块
* LLM 生成模块
* 通信协议（popup 与 background、background 与 content script）

---

## 二、数据处理模块接口（dataManager.js）

```ts
// 加载本地外链数据
function loadBacklinks(): Promise<BacklinkEntry[]>

// 保存或覆盖全部外链数据
function saveBacklinks(data: BacklinkEntry[]): Promise<void>

// 添加或更新单条外链（按 id 匹配）
function upsertBacklink(entry: BacklinkEntry): Promise<void>

// 获取所有站点配置
function loadSiteConfigs(): Promise<SiteConfig[]>

// 获取当前默认站点
function getDefaultSite(): Promise<SiteConfig>
```

---

## 三、任务调度模块接口（background.js）

```ts
// 接收 popup 请求，启动提交任务
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => { ... })

// 提交任务调度器
function handleSubmitTask(backlinkId: string): void

// 控制标签页跳转 + 注入脚本
function openAndInject(tabUrl: string, backlinkId: string, comment: string): void
```

**通信协议**（来自 popup）：

```ts
{
  action: 'submit_link',
  payload: {
    backlink_id: string
  }
}
```

---

## 四、内容注入模块接口（content\_script.js）

```ts
// 注入入口函数
function injectedSubmitFunction(commentText: string, config: any): SubmissionResult

// DOM 操作：识别输入框、填写、点击提交
function findAndFillForm(comment: string): boolean

// 返回提交状态与错误信息
interface SubmissionResult {
  success: boolean
  error?: string
}
```

---

## 五、评论生成模块接口（llmClient.js）

```ts
// 生成评论内容
function generateComment(input: CommentInput): Promise<string>

interface CommentInput {
  page_title: string
  page_excerpt: string
  site_info: SiteConfig
  style: 'technical' | 'neutral' | 'playful'
}
```

---

## 六、界面通信接口

### popup → background

```ts
chrome.runtime.sendMessage({
  action: 'submit_link',
  payload: {
    backlink_id: string
  }
})
```

### background → content\_script

```ts
chrome.scripting.executeScript({
  target: { tabId },
  func: injectedSubmitFunction,
  args: [comment, config]
})
```

### content\_script → background

```ts
window.postMessage({
  type: 'linkpilot_submission_result',
  payload: {
    id: backlinkId,
    success: true,
    error: null
  }
})
```

---

## 七、未来预留接口

* 提交前预检查（是否登录、是否已存在评论）
* 外链评分系统（返回评分用于排序）
* 后端 API 对接接口（如远程同步数据库）

---

（模块接口说明文档完）
