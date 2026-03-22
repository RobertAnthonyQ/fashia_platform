import type { CulqiCharge, CulqiError, CulqiOrder } from "@/src/types/culqi";

const CULQI_API_URL = "https://api.culqi.com/v2";
const CULQI_SECRET_KEY = process.env.CULQI_SECRET_KEY!;

interface CulqiChargePayload {
  amount: number;
  currency_code: string;
  email: string;
  source_id: string;
  description: string;
  antifraud_details: {
    first_name: string;
    last_name: string;
    address: string;
    address_city: string;
    country_code: string;
    phone: string;
  };
  metadata: Record<string, string>;
}

export async function createCharge(
  payload: CulqiChargePayload,
): Promise<{ data: CulqiCharge | null; error: CulqiError | null }> {
  console.log("[Culqi] Creating charge:", JSON.stringify(payload, null, 2));
  console.log("[Culqi] Using secret key:", CULQI_SECRET_KEY ? `${CULQI_SECRET_KEY.slice(0, 12)}...` : "MISSING!");

  const res = await fetch(`${CULQI_API_URL}/charges`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CULQI_SECRET_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const body = await res.json();
  console.log("[Culqi] Response status:", res.status, "body:", JSON.stringify(body, null, 2));

  if (!res.ok) {
    return { data: null, error: body as CulqiError };
  }

  return { data: body as CulqiCharge, error: null };
}

export async function getCharge(
  chargeId: string,
): Promise<{ data: CulqiCharge | null; error: CulqiError | null }> {
  const res = await fetch(`${CULQI_API_URL}/charges/${encodeURIComponent(chargeId)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CULQI_SECRET_KEY}`,
    },
  });

  const body = await res.json();

  if (!res.ok) {
    return { data: null, error: body as CulqiError };
  }

  return { data: body as CulqiCharge, error: null };
}

export async function createOrder(params: {
  amount: number;
  currency_code: string;
  description: string;
  order_number: string;
  client_details: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  };
  expiration_date: number;
  metadata?: Record<string, string>;
}): Promise<{ data: CulqiOrder | null; error: CulqiError | null }> {
  console.log("[Culqi] Creating order:", JSON.stringify(params, null, 2));

  const res = await fetch(`${CULQI_API_URL}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CULQI_SECRET_KEY}`,
    },
    body: JSON.stringify(params),
  });

  const body = await res.json();
  console.log("[Culqi] Order response:", res.status, JSON.stringify(body, null, 2));

  if (!res.ok) {
    return { data: null, error: body as CulqiError };
  }

  return { data: body as CulqiOrder, error: null };
}

export async function getOrder(
  orderId: string,
): Promise<{ data: CulqiOrder | null; error: CulqiError | null }> {
  const res = await fetch(`${CULQI_API_URL}/orders/${encodeURIComponent(orderId)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${CULQI_SECRET_KEY}`,
    },
  });

  const body = await res.json();

  if (!res.ok) {
    return { data: null, error: body as CulqiError };
  }

  return { data: body as CulqiOrder, error: null };
}
