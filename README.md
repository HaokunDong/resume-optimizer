# Resume Optimizer - 简历优化工具

基于 AI 的简历优化工具，帮助用户根据岗位 JD 自动改写和优化简历。

## 🚀 功能特性

- 📝 **JD 输入**：支持文本粘贴和文件上传
- 📄 **简历上传**：支持 PDF/TXT 格式
- 🤖 **AI 改写**：智能分析 JD 关键词，优化简历内容
- 📊 **对比展示**：直观对比原简历与优化版本
- ⬇️ **一键下载**：导出优化后的简历

## 🏗️ 技术栈

- **前端框架**：Next.js 14 (App Router)
- **AI 引擎**：DeepSeek API（OpenAI 兼容格式）
- **部署平台**：Vercel
- **CI/CD**：GitHub Actions / Harness

## 📦 快速开始

### 本地开发

```bash
# 克隆项目
git clone <your-repo-url>
cd resume-optimizer

# 安装依赖
npm install

# 复制环境变量
cp .env.example .env.local
# 编辑 .env.local 配置你的 API Key

# 启动开发服务器
npm run dev
```

### 环境变量配置

```bash
# .env.local
DEEPSEEK_API_KEY=your-api-key
```

## 🔄 CI/CD 配置

### GitHub Actions

1. **添加 Secrets**：
   - `VERCEL_TOKEN`：Vercel 访问令牌
   - `VERCEL_ORG_ID`：Vercel 组织 ID
   - `VERCEL_PROJECT_ID`：Vercel 项目 ID
   - `DEEPSEEK_API_KEY`：DeepSeek API Key（获取地址：https://platform.deepseek.com/api_keys）

2. **自动触发**：
   - CI：推送 PR 或 main 分支时自动运行测试和构建
   - CD：main 分支有新提交时自动部署到 Vercel

### Harness CI/CD

1. **创建项目**：在 Harness 平台创建新项目
2. **导入配置**：导入 `harness-ci.yaml` 文件
3. **配置连接器**：
   - GitHub Connector
   - Docker Hub Connector
   - Vercel Connector
4. **设置触发器**：配置 Webhook 触发

## 🧪 测试

```bash
# 运行测试
npm test

# 运行测试（监听模式）
npm run test:watch

# 生成覆盖率报告
npm run test:coverage
```

## 📁 项目结构

```
resume-optimizer/
├── src/
│   ├── agent/          # Agent 核心模块
│   │   ├── types.ts    # 类型定义
│   │   ├── tools.ts    # 工具系统
│   │   ├── orchestrator.ts  # 编排器
│   │   ├── observability.ts # 可观测性
│   │   ├── codebuddy-http.ts  # LLM 适配器（DeepSeek）
│   │   └── codebuddy.ts       # CodeBuddy CLI 适配器（备用）
│   ├── app/
│   │   ├── page.tsx    # 首页
│   │   └── api/        # API 路由
│   └── components/     # UI 组件
├── scripts/
│   └── test-agent.ts   # Agent 测试脚本
├── .github/
│   └── workflows/      # GitHub Actions 配置
└── harness-ci.yaml     # Harness CI 配置
```

## 🔐 安全说明

- API Key 通过环境变量管理，不提交到代码仓库
- 使用 `.gitignore` 忽略敏感文件
- CI/CD 流水线中使用 Secrets 存储敏感信息

## 📄 License

MIT
