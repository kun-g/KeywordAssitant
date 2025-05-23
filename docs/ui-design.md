# KeywordAssistant 插件页面结构设计文档

---

## 一、页面总览

KeywordAssistant 插件包含以下三大交互界面：

* 插件主界面（Popup）：执行采集、提交操作的主要入口
* 设置页面（Options）：配置站点信息、模型偏好与权限信息
* 外链详情页（弹窗式，可扩展）：查看和编辑具体外链信息，生成评论内容

---

## 二、插件主界面（Popup）

**功能定位**：外链采集、预览、标记、提交的操作中心。

```plaintext
+-----------------------------------------------------------+
| 站点选择：[站点下拉框]                                   |
| [立即采集外链] 按钮 [导入 CSV] 按钮                     |
|-----------------------------------------------------------|
| 外链列表（分页显示）                                     |
| +-------------------------------------------------------+ |
| | 来源域名     | 链接类型 | 状态 | [查看] [提交] [标记] | |
| +-------------------------------------------------------+ |
| 筛选器：[类型] [状态] [平台] [DoFollow] [搜索框]        |
| 导出数据：[JSON] [CSV]                                   |
+-----------------------------------------------------------+
```

交互说明：

* 支持实时筛选外链类型、状态、平台等信息
* 外链状态高亮显示：待提交（灰）/ 已提交（绿）/ 失败（红）/ 忽略（黄）
* 外链列表分页展示，支持操作按钮联动状态修改

---

## 三、设置页面（Options）

**功能定位**：用于配置插件的站点、偏好、权限、API Key 等参数。

```plaintext
+-----------------------------------------------------------+
| 我的站点信息配置                                         |
| - 网站名称：[文本输入]                                   |
| - 主域名：[yourdomain.com]                               |
| - 行业分类：[下拉选择]                                   |
| - 自定义标签：[可多选标签]                               |
|-----------------------------------------------------------|
| 提交偏好设置                                             |
| - 评论风格：[技术型/中立型/俏皮型]                       |
| - 提交方式：[自动 / 半自动 / 手动]                       |
| - 使用模型：[GPT-4 / Claude / Mistral 等]                |
| - API Key 管理：[输入框 / 读取本地配置]                  |
|-----------------------------------------------------------|
| 插件权限状态显示                                         |
| - 当前权限状态：[是否具备 <all_urls>]                    |
| - 提示信息：如何开启/限制跨域权限                        |
|-----------------------------------------------------------|
| 本地数据管理                                             |
| - 清空数据 / 导出数据 / 导入 JSON / CSV                  |
+-----------------------------------------------------------+
```

---

## 四、外链详情页（弹窗，扩展模块）

**功能定位**：展示单条外链详情，支持评论内容生成与手动调整。

```plaintext
+-----------------------------------------------------------+
| 外链来源：https://source.com/page.html                   |
| 锚文本：Your Site                                         |
| 类型：博客   | NoFollow：否   | 状态：未提交             |
| 平台识别：WordPress   标签：[tech] [blog]                |
|-----------------------------------------------------------|
| 评论草稿区                                                 |
| - 自动生成评论：[大文本框，可编辑]                       |
| - 风格切换：[下拉框：技术 / 中立 / 俏皮]                |
| - [重新生成] 按钮                                         |
|-----------------------------------------------------------|
| 提交控制区                                                |
| - 自动提交状态：[等待中 / 已完成 / 失败]                 |
| - 错误信息：[若失败，显示失败原因]                       |
+-----------------------------------------------------------+
```

---
