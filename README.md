# StefBank｜车厘子银行存款系统

手机端优先的私人情侣储蓄记账网站 MVP。当前版本使用本地 mock 数据，不接入真实支付、银行、微信、支付宝或 Supabase。

## 本地运行

```bash
npm install
npm run dev
```

打开浏览器访问：

```bash
http://localhost:3000
```

如果在 PowerShell 中遇到执行策略限制，可以使用：

```bash
npm.cmd install
npm.cmd run dev
```

## 可用脚本

```bash
npm run lint
npm run build
```

## 代码结构

```text
src/app
  layout.tsx        全局 metadata、viewport、样式入口
  page.tsx          StefBank 应用入口
  globals.css       Tailwind 与全局视觉基底

src/components/stefbank
  StefBankApp.tsx       主状态容器与底部 Tab 切换
  AppHeader.tsx         顶部标题区
  BottomNav.tsx         固定底部导航
  HomePanel.tsx         首页
  TransactionsPanel.tsx 流水页
  RequestsPanel.tsx     申请页
  ProfilePanel.tsx      我的页
  ui.tsx                共享卡片、按钮、分段控件等

src/data
  mock-bank.ts      mock 账户、用户、流水、申请数据

src/lib
  format.ts         金额、状态、角色等格式化工具
```

## 当前交互

- 登录页使用本地账号模拟：
  - 行长账号：`admin`
  - 储户账号：`yezi`
  - 密码暂不校验，随便输入或留空都可以。
- 底部 Tab 可切换：首页、流水、申请、我的。
- 流水页可切换全部 / 存入 / 取出，并支持年份与排序筛选。
- 申请页可切换取款申请 / 存款记录。
- 取款申请会校验金额为空、金额小于等于 0、余额不足。
- 提交申请或存款记录后，会加入最近申请列表并显示待审批 / 待确认状态。
- 我的页可用“切换账号”模拟行长 / 储户身份。
