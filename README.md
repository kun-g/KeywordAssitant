# KeywordAssistant

外链收集、管理与提交的Chrome浏览器扩展

## 功能概述

KeywordAssistant是一个强大的Chrome扩展，帮助用户高效管理外部链接，主要包含以下核心功能：

1. **外链收集**：自动从Ahrefs或任意网页抓取外链，支持CSV导入
2. **外链管理**：标记、分类、筛选和搜索你的外链
3. **外链提交**：自动识别评论区/表单入口，使用AI生成评论并辅助提交

## 开发设置

### 环境要求

- Node.js 16+
- npm 或 yarn

### 安装依赖

```bash
npm install
# 或 
yarn
```

### 开发模式

```bash
npm run dev
# 或
yarn dev
```

### 构建生产版本

```bash
npm run build
# 或
yarn build
```

### 在Chrome中加载插件

1. 打开Chrome浏览器，访问`chrome://extensions/`
2. 启用"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择项目`dist`目录

## 项目结构

```
├── src/
│   ├── background.ts        # 背景脚本 
│   ├── content.tsx          # 内容脚本
│   ├── popup/               # 主界面
│   │   ├── index.html       
│   │   └── Popup.tsx        
│   ├── options/             # 设置页面
│   │   ├── index.html
│   │   └── Options.tsx
│   ├── types/               # 类型定义
│   │   └── index.ts
│   ├── styles/              # 样式文件
│   │   └── globals.css
│   └── assets/              # 资源文件
├── public/
│   ├── icons/               # 图标文件
│   └── manifest.json        # 插件配置文件
├── vite.config.ts           # Vite配置
└── package.json             # 项目依赖
```

## 技术栈

- TypeScript
- React
- Tailwind CSS
- Vite + CRXJS
- Chrome Extensions API

## 注意事项

- 插件需要`<all_urls>`权限以便在各种网站上收集和提交外链
- 当前版本处于开发阶段，功能可能不完整

## 联系和贡献
- popup.tsx/getPlatformName 和 contet.tsx/detectPlatform 转移到 utils/platformDetect.tsx