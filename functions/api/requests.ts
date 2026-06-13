import { createClient } from "@supabase/supabase-js";
import { sendWithdrawalRequestBarkNotification } from "../../src/lib/bark";

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
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
};

type PagesFunctionContext = {
  request: Request;
  env: Env;
};

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
      ...init?.headers,
    },
  });
}

function isRequestType(value: unknown): value is RequestType {
  return value === "withdraw" || value === "deposit";
}

function readString(value: unknown, fieldName: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
}

function parsePayload(payload: SubmitRequestPayload) {
  const input = payload.input ?? {};
  const requestType = input.requestType;

  if (!isRequestType(requestType)) {
    throw new Error("requestType is invalid.");
  }

  if (typeof input.amount !== "number" || !Number.isFinite(input.amount) || input.amount <= 0) {
    throw new Error("amount is invalid.");
  }

  return {
    accountId: readString(payload.accountId, "accountId"),
    input: {
      requestType,
      amount: input.amount,
      category: readString(input.category, "category"),
      urgency: typeof input.urgency === "string" && input.urgency.trim() ? input.urgency.trim() : null,
      paymentMethod: readString(input.paymentMethod, "paymentMethod"),
      note: readString(input.note, "note"),
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
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Supabase is not configured.");
  }

  return {
    url: env.NEXT_PUBLIC_SUPABASE_URL,
    key: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

export async function onRequestPost(context: PagesFunctionContext) {
  const { request, env } = context;
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return jsonResponse({ error: "请先登录后再提交申请。" }, { status: 401 });
  }

  let payload: ReturnType<typeof parsePayload>;

  try {
    payload = parsePayload(await request.json());
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

  const supabase = createClient(supabaseConfig.url, supabaseConfig.key, {
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
    return jsonResponse({ error: error.message }, { status: 400 });
  }

  const createdRequest = data as CreatedRequestRow | null;

  if (createdRequest?.request_type === "withdraw" && createdRequest.status === "pending") {
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
        url: new URL("/requests", request.url).toString(),
      });
    } catch (error) {
      console.error("Failed to send Bark withdrawal notification", error);
    }
  }

  return jsonResponse({ ok: true, request: createdRequest });
}
