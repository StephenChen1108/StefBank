import type { Transaction } from "@/data/bank-types";

function csvCell(value: string | number) {
  const text = String(value);
  const safe = /^[\s]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function createTransactionsCsv(transactions: Transaction[]) {
  const rows = [
    ["日期", "类型", "金额（元）", "分类", "备注", "交易后余额（元）", "状态"],
    ...transactions.map((transaction) => [
      transaction.transactionDate,
      transaction.type === "deposit" ? "存入" : "取出",
      transaction.amount,
      transaction.category,
      transaction.description,
      transaction.balanceAfter,
      transaction.status === "confirmed" ? "已确认" : "待确认",
    ]),
  ];
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
}

export function downloadTransactionsCsv(transactions: Transaction[]) {
  const blob = new Blob([createTransactionsCsv(transactions)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `车厘子银行账单-${new Date().toLocaleDateString("sv-SE")}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
