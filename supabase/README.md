# StefBank Supabase 恢复与初始化

## 先判断项目状态

先在 Supabase Dashboard 中检查原项目。如果项目只是暂停，优先恢复原项目并保留数据；如果项目已经删除，再创建新项目。不要把 `scripts/init-supabase.cjs` 用在恢复出的现有数据库上。

## 新项目初始化

1. 在 SQL Editor 中按文件名顺序执行 `supabase/migrations` 下的全部迁移：
   `001`、`002`、`003a`、`003b`、`004`、`005`，以及后续带 UTC 时间戳的迁移。
2. 在项目根目录的 `.env.local` 中配置：

```bash
SUPABASE_PROJECT_REF=...
SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STEFBANK_ADMIN_PASSWORD=<new-password>
STEFBANK_DEPOSITOR_PASSWORD=<new-password>
```

3. 两个密码必须是全新密码，不能复用曾经进入过浏览器包的旧密码。
4. 仅对全新的空项目运行一次：

```powershell
npm.cmd run supabase:init
```

脚本会创建两个 Auth 用户、资料、账户关系和一个余额为零的空账本。

## 恢复原项目

恢复原项目后不要运行初始化脚本。先在 Dashboard 确认表、RPC 和现有业务数据仍在，然后使用 Supabase Auth 管理界面分别为两个用户设置全新密码。

## 部署配置

在 Cloudflare Pages 的构建变量中配置：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
BARK_DEVICE_KEY=...
```

也可以用旧的 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 代替 publishable key。不要创建任何 `NEXT_PUBLIC_*PASSWORD` 或 `NEXT_PUBLIC_*SERVICE_ROLE*` 变量。

更新变量后重新构建部署，并执行：

```powershell
npm.cmd run build
npm.cmd run security:bundle
```

## 后续迁移

线上项目只通过 Supabase CLI 或受认证的迁移控制面应用带 UTC 时间戳的迁移，应用后应让仓库文件名与线上迁移版本完全一致。不要直接执行任意 SQL 文件，也不要修改线上迁移历史记录。

`20260725115038_add_keep_alive_cron.sql` 只保留线上 `keep_alive` 函数定义。现有 `stefbank-keep-alive` 任务每天调用公开 API 三次；迁移文件不会再次调用 `cron.schedule`，以免重放时创建重复任务。
