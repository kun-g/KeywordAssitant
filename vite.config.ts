import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import { resolve } from 'path';
import * as fs from 'fs';
import * as path from 'path';

// 确保manifest.json文件存在
const manifestPath = path.resolve(__dirname, 'public/manifest.json');
const manifest = JSON.parse(
  fs.readFileSync(manifestPath, 'utf-8')
);

// @ts-ignore - 忽略类型错误
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
    extensions: ['.js', '.ts', '.jsx', '.tsx', '.json']
  },
  base: './', // 使用相对路径
  plugins: [
    react(),
    crx({ manifest }),
  ],
  define: {
    // 全局替换变量
    'isDevelopment': JSON.stringify(process.env.NODE_ENV === 'development')
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: process.env.NODE_ENV === 'development',
    rollupOptions: {
      input: {
        // background: resolve(__dirname, 'src/background.ts'),
        // content: resolve(__dirname, 'src/content.tsx'),
        popup: resolve(__dirname, 'src/popup/index.html'),
        options: resolve(__dirname, 'src/options/index.html')
      },
      output: {
        entryFileNames: 'assets/[name].js',
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom']
  },
  esbuild: {
    jsx: 'automatic',
    jsxInject: `import React from 'react'`
  },
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173
    }
  }
}); 