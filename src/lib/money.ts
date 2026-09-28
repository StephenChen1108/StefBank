/** PostgreSQL `integer` upper bound. All StefBank amounts are whole CNY yuan. */
export const MAX_INTEGER_YUAN = 2_147_483_647;

export function isPositiveIntegerYuan(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value > 0 &&
    value <= MAX_INTEGER_YUAN
  );
}

export function parsePositiveIntegerYuan(value: string): number | null {
  const normalized = value.trim();

  if (!/^[1-9]\d*$/.test(normalized)) {
    return null;
  }

  const amount = Number(normalized);
  return isPositiveIntegerYuan(amount) ? amount : null;
}
