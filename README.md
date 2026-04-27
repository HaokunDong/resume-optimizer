# 简历智改 (Resume Optimizer)

AI 驱动的简历优化工具，根据目标岗位 JD 自动改写和优化简历。

## 功能特性

- 📄 支持 PDF/TXT 格式简历上传
- 📝 岗位 JD 粘贴输入
- 🤖 AI 智能分析关键词匹配度
- ✨ 自动生成优化建议
- 📥 一键下载优化后简历

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS + shadcn/ui
- **AI**: OpenAI GPT-4o-mini
- **部署**: Vercel

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env.local
```

然后编辑 `.env.local`，添加你的 OpenAI API Key：

```
OPENAI_API_KEY=sk-your-api-key
```

### 3. 启动开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看效果。

### 4. 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
src/
├── app/
│   ├── api/rewrite/     # AI 改写 API
│   └── page.tsx         # 主页
├── components/
│   ├── ui/              # shadcn/ui 组件
│   └── file-upload.tsx  # 文件上传组件
└── lib/
    └── utils.ts         # 工具函数
```

## CI/CD

本项目使用 Harness 进行持续集成和部署。详见 [Harness 文档](./docs/harness.md)。

## License

MIT
