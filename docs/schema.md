# KeywordAssistant 插件本地数据结构与 Schema 设计文档

---

## 一、总体说明

KeywordAssistant 插件以本地 JSON 格式存储外链与站点配置数据，核心目标是：

* 支持高性能读写
* 便于手动调试 / 导入导出
* 可扩展性强，支持后期对接远程数据库

主要结构包括：


