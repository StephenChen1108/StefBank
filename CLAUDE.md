@AGENTS.md

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

---

# 📦 Context Management

**When you sense the conversation context is getting large** (many tool calls, large file reads, or you notice slowness), **automatically run `/compact`** to compress the conversation before continuing. Do NOT wait for the user to ask — proactively manage context size to avoid hitting limits and degrading performance.

---

# 🔄 Loop Detection & Escape

**You MUST detect and break out of loops automatically.** Signs you're stuck in a loop:

- Attempting the same fix 2+ times and it keeps failing
- Re-reading the same file or re-running the same command with identical results
- Going in circles between different approaches without progress
- Spending 5+ tool calls on a single sub-problem with no forward movement

**When you detect a loop, STOP and do this:**

1. **State clearly**: "I'm stuck in a loop on [X]. Here's what I've tried: [list]."
2. **Analyze root cause**: Why isn't it working? What's different from what you expected?
3. **Try a fundamentally different approach** — not a variation of the same thing
4. **If no alternative approach exists**, stop and ask the user for guidance instead of burning more tokens

**Never repeat the same failing action hoping for a different result.**
