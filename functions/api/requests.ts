import { createClient } from "@supabase/supabase-js";
import { sendWithdrawalRequestBarkNotification } from "../../src/lib/bark";
import { isPositiveIntegerYuan } from "../../src/lib/money";
import { resolveSupabasePublicKey } from "../../src/lib/supabase-config";

type RequestType = "withdraw" | "deposit";

type RequestInput = {
  requestType: RequestType;
  amount: number;
  category: string;
  urgency?: string;
  paymentMethod: string;
  note: string;
};

type SubmitRequestPayload = {
  accountId?: unknown;
  input?: Partial<RequestInput>;
};

type CreatedRequestRow = {
  id: string;
  requester_id: string;
  request_type: RequestType;
  amount: number;
  note: string;
  status: string;
};

type ProfileRow = {
  username: string;
  full_name: string | null;
  display_name: string | null;
};

type Env = {
  BARK_DEVICE_KEY?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
};

const MAX_BODY_BYTES = 16 * 1024;

const currencyFormatter = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  maximumFractionDigits: 0,
});

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...init?.headers,
    },
  });
}

function isRequestType(value: unknown): value is RequestType {
  return value === "withdraw" || value === "deposit";
}

function readString(value: unknown, fieldName: string, maxLength: number) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }

  const normalized = value.trim();

  if (normalized.length > maxLength) {
    throw new Error(`${fieldName} is too long.`);
  }

  return normalized;
}

function parsePayload(payload: SubmitRequestPayload) {
  const input = payload.input ?? {};
  const requestType = input.requestType;

  if (!isRequestType(requestType)) {
    throw new Error("requestType is invalid.");
  }

  if (!isPositiveIntegerYuan(input.amount)) {
    throw new Error("amount is invalid.");
  }

  return {
    accountId: readString(payload.accountId, "accountId", 128),
    input: {
      requestType,
      amount: input.amount,
      category: readString(input.category, "category", 100),
      urgency:
        typeof input.urgency === "string" && input.urgency.trim()
          ? readString(input.urgency, "urgency", 50)
          : null,
      paymentMethod: readString(input.paymentMethod, "paymentMethod", 100),
      note: readString(input.note, "note", 500),
    },
  };
}

function getRequesterName(profile: ProfileRow | null) {
  if (!profile) {
    return "储户";
  }

  return profile.display_name || profile.full_name || profile.username || "储户";
}

function getSupabaseConfig(env: Env) {
  const key = resolveSupabasePublicKey(
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  if (!env.NEXT_PUBLIC_SUPABASE_URL || !key) {
    throw new Error("Supabase is not configured.");
  }

  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    key,
  };
}

function createRequestSupabaseClient(
  url: string,
  key: string,
  authorization: string,
) {
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: {
      headers: {
        Authorization: authorization,
      },
    },
  });
}

async function notifyWithdrawalRequest(
  supabase: ReturnType<typeof createRequestSupabaseClient>,
  env: Env,
  requestUrl: string,
  createdRequest: CreatedRequestRow,
): Promise<void> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, full_name, display_name")
      .eq("id", createdRequest.requester_id)
      .single();

    await sendWithdrawalRequestBarkNotification({
      deviceKey: env.BARK_DEVICE_KEY,
      requesterName: getRequesterName(profile as ProfileRow | null),
      amountText: currencyFormatter.format(createdRequest.amount),
      note: createdRequest.note,
      url: new URL("/requests", requestUrl).toString(),
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        message: "withdrawal notification failed",
        error: error instanceof Error ? error.message : "unknown error",
        requestId: createdRequest.id,
      }),
    );
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return jsonResponse({ error: "请先登录后再提交申请。" }, { status: 401 });
  }

  let payload: ReturnType<typeof parsePayload>;

  try {
    const declaredSize = Number(request.headers.get("content-length") ?? 0);

    if (declaredSize > MAX_BODY_BYTES) {
      return jsonResponse({ error: "申请内容过大。" }, { status: 413 });
    }

    const rawBody = await request.text();

    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return jsonResponse({ error: "申请内容过大。" }, { status: 413 });
    }

    payload = parsePayload(JSON.parse(rawBody) as SubmitRequestPayload);
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "申请内容无效。" },
      { status: 400 },
    );
  }

  let supabaseConfig: ReturnType<typeof getSupabaseConfig>;

  try {
    supabaseConfig = getSupabaseConfig(env);
  } catch (error) {
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Supabase is not configured." },
      { status: 500 },
    );
  }

  const supabase = createRequestSupabaseClient(
    supabaseConfig.url,
    supabaseConfig.key,
    authorization,
  );

  const { data, error } = await supabase.rpc("submit_request", {
    p_account_id: payload.accountId,
    p_request_type: payload.input.requestType,
    p_amount: payload.input.amount,
    p_category: payload.input.category,
    p_urgency: payload.input.urgency,
    p_payment_method: payload.input.paymentMethod,
    p_note: payload.input.note,
  });

  if (error) {
    console.error("Supabase submit_request failed", error);
    return jsonResponse({ error: "提交失败，请稍后重试。" }, { status: 400 });
  }

  const createdRequest = data as CreatedRequestRow | null;

  if (createdRequest?.request_type === "withdraw" && createdRequest.status === "pending") {
    context.waitUntil(
      notifyWithdrawalRequest(supabase, env, request.url, createdRequest),
    );
  }

  return jsonResponse({ ok: true, request: createdRequest });
};
