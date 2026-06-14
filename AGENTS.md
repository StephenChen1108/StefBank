<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# 🔒 Secrets & Credentials Policy — CRITICAL

**Never leak sensitive information.** This includes tokens, API keys, passwords, credentials, and any other secrets.

## Rules

1. **Never write real secret values into any tracked file.** Use placeholders (e.g., `YOUR_SUPABASE_PAT_HERE`) or environment variable references (e.g., `${SUPABASE_ACCESS_TOKEN}`).
2. **Never echo/print secret values** in tool output, logs, terminal output, or conversation — even partially. Redact with `***` if you must reference them.
3. **Check `.gitignore` before creating files** that will contain secrets. Ensure `.mcp.json`, `.env*`, and similar are listed.
4. **Scan before committing:** run `grep -rE 'sbp_|sk-|ghp_|AKIA|eyJ' .` to catch accidental leaks.
5. **If a leak happens**, immediately:
   - Replace the value with a placeholder in the file
   - Clean git history with `git-filter-repo --replace-text`
   - Re-add origin remote (filter-repo removes it)
   - Notify the user to rotate the token on the provider's dashboard
   - Force push the cleaned history

## Already gitignored

The following files are already in `.gitignore` — do NOT remove them:
- `.mcp.json`
- `.env*` (except `.env.example`)
- `.claude/`
