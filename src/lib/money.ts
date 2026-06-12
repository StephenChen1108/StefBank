/**
 * 金额工具函数 — 所有内部金额单位为"分"（integer），避免浮点精度问题。
 */

/** 分 → 元（用于显示） */
export function centsToYuan(cents: number): number {
  return cents / 100;
}

/** 元字符串 → 分（用于输入）。返回 null 表示输入无效。 */
export function yuanToCents(yuan: string): number | null {
  if (!yuan || !yuan.trim()) return null;
  const num = Number(yuan);
  if (!num || num <= 0 || !Number.isFinite(num)) return null;
  return Math.round(num * 100);
}

/** 验证是否为有效的金额输入（正数，最多两位小数） */
export function isValidYuanInput(yuan: string): boolean {
  if (!yuan || !yuan.trim()) return false;
  const num = Number(yuan);
  if (!num || num <= 0 || !Number.isFinite(num)) return false;
  const parts = yuan.split(".");
  if (parts.length > 1 && parts[1].length > 2) return false;
  return true;
}

/** 分 → 显示用的元字符串（如 330000 → "3,300"） */
export function formatCentsAsYuan(cents: number): string {
  return new Intl.NumberFormat("zh-CN").format(centsToYuan(cents));
}
