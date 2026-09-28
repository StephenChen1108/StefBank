export type WithdrawalBarkNotification = {
  deviceKey?: string;
  requesterName: string;
  amountText: string;
  note: string;
  url: string;
};

const BARK_PUSH_URL = "https://api.day.app/push";
const BARK_WITHDRAWAL_TITLE = "车厘子银行：新的取款申请";

export async function sendWithdrawalRequestBarkNotification({
  deviceKey,
  requesterName,
  amountText,
  note,
  url,
}: WithdrawalBarkNotification) {
  if (!deviceKey) {
    throw new Error("BARK_DEVICE_KEY is not configured.");
  }

  const response = await fetch(BARK_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      device_key: deviceKey,
      title: BARK_WITHDRAWAL_TITLE,
      body: [
        `申请人：${requesterName}`,
        `取款金额：${amountText}`,
        `申请理由/备注：${note}`,
      ].join("\n"),
      url,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(`Bark push failed: ${response.status} ${response.statusText}${errorText ? ` ${errorText}` : ""}`);
  }

  const result = await response.json().catch(() => null);

  if (
    result &&
    typeof result === "object" &&
    "code" in result &&
    typeof result.code === "number" &&
    result.code !== 200
  ) {
    throw new Error(`Bark push failed: ${JSON.stringify(result)}`);
  }
}
