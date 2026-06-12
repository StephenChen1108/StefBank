-- 迁移：金额从"元"改为"分"（所有金额列乘以 100）
-- 列类型保持 integer，语义从"元"变为"分"

-- 1. 更新 accounts 余额
UPDATE accounts SET current_balance = current_balance * 100;

-- 2. 更新 goals 金额
UPDATE goals SET target_amount = target_amount * 100, current_amount = current_amount * 100;

-- 3. 更新 requests 金额
UPDATE requests SET amount = amount * 100;

-- 4. 更新 transactions 金额（需要先删旧流水再重新生成，因为 balance_after 依赖顺序）
-- 先按 transaction_date, id 排序，重新计算 balance_after
WITH ordered AS (
  SELECT
    id,
    type,
    amount * 100 AS new_amount,
    SUM(CASE WHEN type = 'deposit' THEN amount * 100 ELSE -(amount * 100) END)
      OVER (PARTITION BY account_id ORDER BY transaction_date, id) AS new_balance
  FROM transactions
)
UPDATE transactions
SET
  amount = ordered.new_amount,
  balance_after = ordered.new_balance
FROM ordered
WHERE transactions.id = ordered.id;
