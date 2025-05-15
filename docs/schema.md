# LinkPilot 插件本地数据结构与 Schema 设计文档

---

## 一、总体说明

LinkPilot 插件以本地 JSON 格式存储外链与站点配置数据，核心目标是：

* 支持高性能读写
* 便于手动调试 / 导入导出
* 可扩展性强，支持后期对接远程数据库

主要结构包括：

* 外链列表（backlinks）
* 提交站点信息（site\_config）
* 评论风格与模型偏好设置（settings）

---

## 二、主数据结构：backlinks

每一条外链记录的字段定义如下：

```ts
interface BacklinkEntry {
  id: string                     // 唯一ID，可用 UUID 或 hash(source+target)
  source_url: string            // 外链来源页面地址
  anchor: string                // 锚文本
  target_url: string            // 链接指向的目标地址（通常为用户站点）
  type: 'blog' | 'forum' | 'directory' | 'paid' | 'other' // 外链类型
  platform?: 'wordpress' | 'disqus' | 'custom' | null     // 平台识别
  nofollow: boolean            // 是否为 nofollow 链接
  tags: string[]               // 用户自定义标签（行业、来源等）
  industry?: string            // 所属行业标签（可选）
  status: 'new' | 'pending' | 'submitted' | 'success' | 'fail' | 'skipped' // 状态
  error?: string               // 提交失败原因（若有）
  comment?: string             // 实际提交的评论文本（如适用）
  timestamp_created: string    // 创建时间（ISO 时间戳）
  timestamp_submitted?: string // 提交时间（如已提交）
}
```

**说明：**

* `status` 字段用于追踪任务处理流程
* `comment` 字段可用于回看已提交内容（尤其适合 AI 生成内容）
* 可扩展 `platform` 为多个识别结果的组合（如有多级插件结构）

---

## 三、站点配置结构：site\_config

```ts
interface SiteConfig {
  id: string              // UUID（支持多站点）
  name: string            // 站点名称
  domain: string          // 主域名（如 yourdomain.com）
  industry: string        // 行业分类标签
  tags: string[]          // 自定义标签
  default: boolean        // 是否为当前默认使用站点
}
```

支持多站点切换，在主界面切换站点后，后续提交记录将归属该站点。

---

## 四、偏好与模型配置结构：settings

```ts
interface PluginSettings {
  comment_style: 'technical' | 'neutral' | 'playful'  // 评论风格偏好
  model_provider: 'gpt-4' | 'claude' | 'mistral'      // LLM 提供者
  api_key: string                                      // API Key（本地保留）
  auto_submit: boolean                                 // 是否启用自动提交
  allowed_domains: string[]                            // 插件可访问的目标域名白名单
}
```

---

## 五、文件组织建议

若采用文件式存储结构，建议如下：

```
linkpilot/
├── data/
│   ├── backlinks.json         # 所有外链记录
│   ├── sites.json             # 站点配置
│   └── settings.json          # 用户偏好
└── README.md
```

若使用 `chrome.storage.local`，推荐以命名空间方式组织键值：

* `linkpilot::backlinks`
* `linkpilot::sites`
* `linkpilot::settings`

---

## 六、字段命名与可扩展性原则

* 命名风格统一使用 `snake_case`（JSON 兼容性高）
* 所有枚举字段使用英文字符串，便于后续迁移至数据库
* 字段保留可选属性（如 `error`, `comment`, `platform`）以支持不同平台灵活扩展

---

（Schema 文档完）
