/** 支出分类（不含"存款"） */
export const EXPENSE_CATEGORIES = ["购物", "吃饭", "学习", "交通", "应急", "其他"] as const;

/** 全部流水分类（含"存款"） */
export const ALL_CATEGORIES = ["存款", ...EXPENSE_CATEGORIES] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type AllCategory = (typeof ALL_CATEGORIES)[number];
