// ─── Culqi API Types ───

export interface CulqiToken {
  id: string;
  type: string;
  email: string;
  creation_date: number;
  card_number: string;
  last_four: string;
  active: boolean;
  iin: {
    bin: string;
    card_brand: string;
    card_type: string;
    card_category: string;
    issuer: {
      name: string;
      country: string;
      country_code: string;
      website: string | null;
      phone_number: string | null;
    };
  };
  client: {
    ip: string;
    ip_country: string;
    ip_country_code: string;
    browser: string | null;
    device_fingerprint: string | null;
    device_type: string | null;
  };
  metadata: Record<string, string>;
}

export interface CulqiCharge {
  id: string;
  creation_date: number;
  amount: number;
  current_amount: number;
  installments: number;
  currency_code: string;
  email: string;
  description: string | null;
  source: {
    id: string;
    type: string;
    creation_date: number;
    email: string;
    card_number: string;
    last_four: string;
    active: boolean;
    iin: CulqiToken["iin"];
    client: CulqiToken["client"];
    metadata: Record<string, string>;
    object: string;
  };
  outcome: {
    type: string;
    code: string;
    decline_code: string | null;
    merchant_message: string;
    user_message: string;
  };
  fraud_score: number | null;
  antifraud_details: {
    first_name: string;
    last_name: string;
    address: string;
    address_city: string;
    country_code: string;
    phone: string;
  };
  reference_code: string;
  metadata: Record<string, string>;
  total_fee: number;
  fee_details: {
    fixed_fee: Record<string, number>;
    variable_fee: Record<string, number>;
  };
  transfer_amount: number;
  paid: boolean;
  statement_descriptor: string;
  transfer_id: string | null;
  capture: boolean;
  object: string;
}

export interface CulqiError {
  object: string;
  type: string;
  charge_id: string | null;
  code: string;
  decline_code: string | null;
  merchant_message: string;
  user_message: string;
}

export interface CulqiCustomer {
  id: string;
  creation_date: number;
  email: string;
  first_name: string;
  last_name: string;
  address: string | null;
  address_city: string | null;
  country_code: string;
  phone_number: string | null;
  metadata: Record<string, string>;
  object: string;
}

export interface CulqiCard {
  id: string;
  creation_date: number;
  customer_id: string;
  source: {
    id: string;
    type: string;
    creation_date: number;
    card_number: string;
    last_four: string;
    active: boolean;
    iin: CulqiToken["iin"];
    client: CulqiToken["client"];
    metadata: Record<string, string>;
    object: string;
  };
  metadata: Record<string, string>;
  object: string;
}

// ─── Order Types ───

export interface CulqiOrder {
  id: string;
  amount: number;
  currency_code: string;
  description: string;
  order_number: string;
  state: string;
  qr: string | null;
  url: string | null;
  available_payment_methods: string[];
  expiration_date: number;
  metadata: Record<string, string>;
  created_at: number;
  updated_at: number;
}

// ─── Webhook Event Types ───

export type CulqiWebhookEventType =
  | "charge.creation.succeeded"
  | "charge.creation.failed"
  | "order.status.changed"
  | "subscription.charge.succeeded"
  | "subscription.charge.failed"
  | "subscription.canceled";

export interface CulqiWebhookEvent {
  id: string;
  type: CulqiWebhookEventType;
  creation_date: number;
  data: CulqiCharge & { state?: string; status?: string };
}

// ─── Request/Response DTOs ───

export interface CreateChargeRequest {
  token_id: string;
  package_id: string;
  quantity?: number; // Only for "sueltos"
}

export interface ChargeResponse {
  success: boolean;
  credits: number;
  charge_id: string;
  message: string;
}
