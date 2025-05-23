# KeywordAssistant 插件错误与异常处理机制文档

---

## 一、目的

该文档用于说明 KeywordAssistant 插件在运行过程中可能遇到的错误类型、检测方式、错误码定义、用户反馈机制与日志记录策略，确保系统具备：

* 明确的异常分类与响应路径
* 统一的错误展示与回传格式
* 后期可追踪、可调试的日志基础

---

## 二、错误分类与处理策略

### 2.1 外链采集类错误

| 错误类型        | 触发条件               | 处理策略         |
| ----------- | ------------------ | ------------ |
| 空页面         | 页面未加载或 DOM 不可访问    | 提示用户刷新页面重试   |
| 非 Ahrefs 页面 | 当前页面结构不符预期报告格式     | 弹窗警告并允许手动切换  |
| 链接缺失        | 无有效 `<a href>` 可抓取 | 提示“未发现外链”    |
| CSV 格式错误    | 字段缺失、行数据不匹配        | 拒绝导入 + 错误行高亮 |

### 2.2 数据处理类错误

| 错误类型        | 触发条件                             | 处理策略                   |
| ----------- | -------------------------------- | ---------------------- |
| JSON 写入失败   | 存储空间满 / Chrome 存储异常              | 尝试 fallback + 提示“存储失败” |
| 数据缺字段       | 手动导入 JSON 缺少必要键                  | 校验失败并提示用户检查结构          |
| ID 冲突 / 重复项 | 相同 `source_url + target_url` 已存在 | 自动合并或弹窗提醒“是否覆盖记录”      |

### 2.3 提交执行类错误

| 错误码   | 描述            | 处理策略               |
| ----- | ------------- | ------------------ |
| E1001 | 页面加载失败        | 自动重试最多 3 次，若仍失败则标红 |
| E1002 | 未找到评论输入框      | 记录失败原因，允许手动重新识别平台  |
| E1003 | 提交按钮不可点击      | 标记失败并提示“结构不兼容”     |
| E1004 | 表单提交后页面跳转失败   | 延迟判断后标为失败并建议手动核查   |
| E1005 | 模型响应超时 / 生成失败 | 提示“评论生成失败”，支持重试按钮  |

### 2.4 LLM 调用类错误

| 错误类型       | 触发条件         | 处理策略             |
| ---------- | ------------ | ---------------- |
| API Key 无效 | 返回 401 或 403 | 弹窗提示用户检查 Key 设置  |
| 模型超时       | 无响应或网络中断     | 超时后进入失败状态 + 可重试  |
| 返回内容为空     | 模型响应但内容为空    | 提示“生成失败”，记录上下文重试 |

---

## 三、统一错误对象格式

在代码中，所有错误均统一记录为以下结构：

```ts
interface SubmissionError {
  code: string         // 错误码，如 'E1003'
  message: string      // 简要描述，如“提交按钮不可点击”
  detail?: string      // 附加调试信息（如 DOM 节点路径）
  timestamp: string    // ISO 格式时间戳
}
```

---

## 四、用户提示规范

| 场景   | UI 表现形式        | 操作建议按钮     |
| ---- | -------------- | ---------- |
| 轻微提示 | 页面右下 toast 提示  | 无需打断流程     |
| 中度阻断 | 弹窗 + 红色警告图标    | 提供“重试”按钮   |
| 严重错误 | 显示错误详情 + 打开设置页 | 提供“检查配置”按钮 |

---

## 五、错误日志记录位置

所有错误将：

* 在外链记录中写入 `error` 字段（见 Schema 文档）
* 同步输出至开发控制台（仅开发模式）
* 后续版本可扩展至日志文件或远程追踪服务

---

## 六、未来扩展建议

* 引入错误码枚举集中管理（errorCodes.ts）
* 引入错误频次统计（如连续某错误超过 3 次高亮）
* 添加日志导出功能（辅助远程调试与用户回溯）

---

（错误与异常处理机制文档完）
