# KeywordAssistant 插件产品需求文档（PRD）

## 一、产品概述

### 1.1 产品名称

**KeywordAssistant**

### 1.2 产品目标

KeywordAssistant 是一款专为提高找词效率的工具。

### 1.3 用户群体

* SEO 从业人员
* 产品经理
* 产品运营
* 市场研究人员

### 1.4 产品定位

KeywordAssistant 是一个“半自动化反向链接获取助手”，强调人机协作下的效率最大化，致力于解决当前手动搜集、管理和提交外链效率低、可追踪性差的问题。

---

## 二、核心功能与模块

### 2.1 SimilarWeb 数据提取

- 关键词数据提取
- 落地页抓取
https://sim.3ue.co/#/organicsearch/pageAnalysis/landing-pages-v2/*/999/28d?key=crazygames.com&pageFilter=%5B%7B%22url%22%3A%22crazygames.com%22%2C%22searchType%22%3A%22domain%22%7D%5D&webSource=Total&selectedPageTab=Organic

---

## 三、用户流程

1. 用户配置站点信息
2. 在 Ahrefs 或任意页面中点击插件，采集外链
3. 浏览和标记外链类型、状态、平台等
4. 将特定外链加入提交清单
5. 插件逐个访问并尝试提交（生成评论 / 填写表单）
6. 成功或失败结果更新状态并记录日志

---

## 四、技术架构与权限说明

### 4.1 插件结构

* MV3 架构：使用 content script 与 background 交互
* UI 使用 popup 页面和设置页面进行交互
* 数据存储：本地 JSON 文件，未来可切换为远程数据库或 Notion API

### 4.2 插件权限

插件需申请以下权限以支持目标功能：

* `<all_urls>`：访问并操作任意外链页面 DOM（提交入口识别与提交）
* `scripting`：动态注入内容脚本以控制页面行为
* `storage`：保存本地配置、站点信息与外链数据

> ⚠️ 请注意：在发布 Chrome 插件时，应限制 `<all_urls>` 为特定外链来源域名，以避免审核风险。

---

## 五、后续扩展方向（Roadmap 简要）

* 支持远程数据同步（如 Supabase）
* 支持团队协作与任务分发
* 表单与评论提交规则学习与复用（自动适配结构）
* 更智能的链接价值评估（基于权重/收录/标签等）
* Web 端管理后台（用于多端联动）

---
