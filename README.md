# StefBank｜车厘子银行存款系统

手机端优先的私人情侣储蓄记账网站。基于 Next.js 16 + React 19，以 Supabase 作为后端（Auth + PostgreSQL + RPC），部署于 Cloudflare Pages。

## 技术栈

- **框架**: Next.js 16.2.7 (App Router)
- **UI**: React 19 + Tailwind CSS v4
- **动画**: GSAP 3.15
- **图标**: lucide-react
- **后端**: Supabase（认证 + PostgreSQL 数据库 + RLS 行级安全）
- **部署**: Cloudflare Pages（静态导出）

## 本地运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 Supabase

在项目根目录创建 `.env.local`，填入你的 Supabase 项目信息：

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### 3. 初始化数据库

运行迁移脚本创建数据库表和 RPC 函数：

```bash
npm run supabase:init
```

### 4. 启动开发服务器

```bash
npm run dev
```

打开浏览器访问 http://localhost:3000

> 在 PowerShell 中如遇到执行策略限制，使用 `npm.cmd` 替代 `npm`。

## 可用脚本

```bash
npm run dev            # 启动开发服务器
npm run build          # 生产构建（静态导出到 out/）
npm run lint           # ESLint 检查
npm run supabase:init  # 运行 Supabase 数据库迁移
```

## 代码结构

```text
src/app
  layout.tsx                   全局 metadata、viewport、样式入口
  page.tsx                     StefBank 应用入口
  globals.css                  Tailwind 与全局视觉基底

src/components/stefbank
  StefBankApp.tsx              主状态容器、Tab 切换、登录态管理
  AppHeader.tsx                顶部标题栏
  BottomNav.tsx                固定底部导航（首页/流水/申请/我的）
  HomePanel.tsx                首页：余额卡片、快捷操作、储蓄目标、最近流水
  TransactionsPanel.tsx        流水页：分类筛选、年份/排序、行长可编辑/删除
  RequestsPanel.tsx            申请页：储户申请中心 / 行长审批面板
  ProfilePanel.tsx             我的页：用户信息、设置菜单、退出登录
  LoginPanel.tsx               登录页（Supabase Auth）
  MoneyActionScreen.tsx        全屏覆盖：存钱/取钱申请表单
  TransactionActionScreen.tsx  全屏覆盖：行长新增/编辑/删除流水
  PageMotion.tsx               Tab 切换动画
  ui.tsx                       共享组件：Card, FeatureCard, IconBadge, ActionButton,
                               SegmentedControl, ChipGroup

src/data
  mock-bank.ts                 类型定义：UserRole, Transaction, BankRequest 等
  mockUsers.ts                 Mock 用户数据（离线开发参考）
  mockTransactions.ts          Mock 流水数据（离线开发参考）
  mockRequests.ts              Mock 申请数据（离线开发参考）

src/lib
  supabase-client.ts            Supabase 浏览器客户端（单例）
  stefbank-supabase.ts          所有数据操作：登录、快照加载、申请/流水 CRUD
  format.ts                     金额、状态、角色等格式化工具

supabase/migrations
  001_stefbank_schema.sql      建表、枚举类型、RLS 策略、核心 RPC 函数
  002_stefbank_edit_transaction.sql  流水编辑/删除 RPC 函数

scripts
  init-supabase.cjs            Supabase 初始化脚本
  run-migration.cjs            迁移执行脚本
```

## 角色与交互

系统包含两种角色，通过 Supabase Auth 登录区分：

### 行长（Manager）
- 账号：`admin@stefbank.local`
- 审批储户的取款申请（批准 → 标记已打款）
- 确认储户的存款到账
- 手动新增/编辑/删除流水记录
- 驳回申请

### 储户（Depositor）
- 账号：`yezi@stefbank.local`
- 提交取款申请（需填写金额、用途、紧急程度、收款方式）
- 提交存款记录
- 查看自己的申请状态

### 取款流程
```
储户提交申请 → pending → 行长批准 → approved → 行长标记已打款 → completed（扣款+创建流水）
```

### 存款流程
```
储户提交记录 → pending → 行长确认到账 → completed（入账+创建流水）
```

## 功能特性

- **余额与统计**：首页展示当前余额、本月存入/取出、储蓄目标进度条、最近 3 条流水
- **流水管理**：按全部/存入/取出发筛选，按年份和排序查看，行长可点击进入编辑/删除
- **申请审批**：行长面板分"待审批""已批准待完成""最近处理"三区管理
- **表单校验**：取款时校验余额不足，金额为空或 ≤0 时给出提示
- **入场动画**：GSAP 驱动的 Tab 切换和全屏覆盖层动画（尊重 prefers-reduced-motion）
- **安全机制**：Supabase RLS + security definer RPC，所有数据操作经数据库权限校验

## 部署

项目配置为静态导出模式（`output: "export"`），构建产物在 `out/` 目录，可直接部署到 Cloudflare Pages 等静态托管服务：

```bash
npm run build
```

构建后的 `out/` 目录即为可部署的静态站点。
