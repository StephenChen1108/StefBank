# StefBank｜车厘子银行存款系统

手机端优先的私人情侣储蓄记账网站。基于 Next.js 16 + React 19，以 Supabase 作为后端（Auth + PostgreSQL + RPC），部署于 Cloudflare Pages。

## 技术栈

- **框架**: Next.js 16.2.7 (App Router, 静态导出)
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
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
# 或使用 legacy anon key:
# NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

可选：设置 `NEXT_PUBLIC_DATA_SOURCE=mock` 使用本地 Mock 数据（无需 Supabase）。

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
  layout.tsx                   全局 metadata、viewport、ToastProvider
  page.tsx                     StefBank 应用入口
  error.tsx                    页面级错误边界
  global-error.tsx             根级错误边界
  globals.css                  Tailwind 与全局视觉基底、CSS 动画

src/components/stefbank
  StefBankApp.tsx              主状态容器、Tab 切换、登录态管理、全屏覆盖层调度
  AppHeader.tsx                顶部标题栏（车厘子银行 + 头像/通知按钮）
  BottomNav.tsx                固定底部导航（首页/流水/申请·审批/我的）
  HomePanel.tsx                首页：余额卡片、快捷操作、本月统计、储蓄目标、最近流水
  TransactionsPanel.tsx        流水页：全部/存入/取出筛选、年份筛选、排序、行长可编辑
  RequestsPanel.tsx            申请页：储户申请中心 / 行长审批面板（待审批/已批准/已处理）
  ProfilePanel.tsx             我的页：用户信息、目标管理入口、设置菜单、退出登录
  LoginPanel.tsx               登录页（Supabase Auth，用户名→邮箱转换）
  MoneyActionScreen.tsx        全屏覆盖：存钱/取钱申请表单（分类、紧急度、收款方式）
  TransactionActionScreen.tsx  全屏覆盖：行长新增/编辑/删除流水 + 储户只读详情
  GoalEditorScreen.tsx         全屏覆盖：储蓄目标编辑（类型选择→表单，支持 5 种目标类型）
  PageMotion.tsx               Tab 切换 GSAP 动画（尊重 prefers-reduced-motion）
  ToastProvider.tsx            Toast 通知上下文提供者
  Toast.tsx                    Toast 组件（3 秒自动消失）
  ui.tsx                       共享组件：Card, FeatureCard, CherryMark, IconBadge,
                               ActionButton, SegmentedControl

src/data
  bank-types.ts                类型定义：UserRole, Transaction, BankRequest, SavingGoal 等
  categories.ts                支出分类（购物/吃饭/学习/交通/应急/其他）+ 存款分类
  goal-types.ts                5 种储蓄目标类型定义（旅行/买房/买车/购物/自定义）

src/lib
  supabase-client.ts           Supabase 浏览器客户端（单例，支持 publishable key）
  stefbank-supabase.ts         Supabase 数据源：登录、快照加载、所有 RPC 调用
  bank-data-source.ts          BankDataSource 接口定义 + 输入类型
  bank-data-source-factory.ts  数据源工厂（根据环境变量切换 Supabase / Mock）
  mock-bank-data-source.ts     Mock 数据源（离线开发用）
  format.ts                    金额、状态、角色等格式化工具
  money.ts                     金额工具函数（分/元转换、输入校验）

supabase/migrations
  001_stefbank_schema.sql              建表、枚举、索引、RLS 策略、核心 RPC 函数
  002_stefbank_edit_transaction.sql    流水编辑/删除 RPC 函数
  003_stefbank_review_note.sql         审批备注字段 + 审批/驳回函数签名升级
  003_optimize_balance_recalc.sql      余额重算性能优化（窗口函数替代循环）
  004_stefbank_delete_request.sql      删除申请 RPC 函数
  005_stefbank_goal_management.sql     目标类型/元数据字段 + 目标增删 RPC
  006_amounts_in_cents.sql             金额单位迁移（元→分）

scripts
  init-supabase.cjs            Supabase 初始化脚本（建表 + 种子数据）
  run-migration.cjs            迁移执行脚本（通过 Supabase API）
  run-migration-direct.cjs     迁移执行脚本（直连 PostgreSQL）
```

## 角色与交互

系统包含两种角色，通过用户名 + 密码登录：

### 行长（Manager）
- 用户名：`admin`
- 审批储户的取款申请（批准 → 标记已打款）
- 确认储户的存款到账
- 手动新增/编辑/删除流水记录
- 驳回申请（需填写审批备注）
- 删除申请

### 储户（Depositor）
- 用户名：`yezi`
- 提交取款申请（需填写金额、用途、紧急程度、收款方式）
- 提交存款记录
- 管理储蓄目标（创建/编辑/删除，5 种目标类型）
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
- **流水管理**：按全部/存入/取出发筛选，按年份和排序查看，行长可点击进入编辑/删除，储户可查看只读详情
- **申请审批**：行长面板分"待审批""已批准待完成""最近处理"三区管理，审批/驳回需填写备注
- **储蓄目标**：5 种目标类型（旅行/买房/买车/购物/自定义），支持自定义字段和元数据，进度自动计算
- **表单校验**：取款时校验余额不足，金额为空或 ≤0 时给出提示
- **Toast 通知**：操作成功/失败即时反馈，3 秒自动消失
- **入场动画**：GSAP 驱动的 Tab 切换和全屏覆盖层动画（尊重 prefers-reduced-motion）
- **安全机制**：Supabase RLS + security definer RPC，所有数据操作经数据库权限校验
- **金额精度**：内部以"分"为单位存储和计算，避免浮点精度问题

## 数据库架构

6 张核心表，全部启用 RLS：

| 表 | 用途 |
|---|---|
| `profiles` | 用户资料（关联 auth.users） |
| `accounts` | 银行账户（slug、名称、余额） |
| `account_members` | 用户-账户关联（角色） |
| `goals` | 储蓄目标（类型、元数据、金额、进度） |
| `requests` | 存取款申请（完整生命周期追踪） |
| `transactions` | 流水账簿（关联申请、余额快照） |

11 个 RPC 函数（`stefbank_private` 安全定义者 + `public` 包装器），覆盖申请提交、审批、驳回、完成、确认、流水增删改、目标增删。

## 部署

项目配置为静态导出模式（`output: "export"`），构建产物在 `out/` 目录，可直接部署到 Cloudflare Pages 等静态托管服务：

```bash
npm run build
```

构建后的 `out/` 目录即为可部署的静态站点。
