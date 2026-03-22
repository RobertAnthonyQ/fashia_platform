"use client";

import { useState, useRef, useCallback } from "react";
import { X, Loader2, Lock, ShieldCheck } from "lucide-react";

interface PaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (tokenId: string) => void;
  amount: number;
  amountDisplay: string;
  description: string;
}

interface CardForm {
  number: string;
  month: string;
  year: string;
  cvv: string;
  email: string;
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

type CardBrand = "visa" | "mastercard" | "amex" | "diners" | "";

function getCardBrand(number: string): CardBrand {
  const n = number.replace(/\s/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^3(?:0[0-5]|[68])/.test(n)) return "diners";
  return "";
}

// ─── Real Card Brand SVGs ───

function VisaIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#1A1F71"/>
      <path d="M19.5 21H17L18.8 11H21.3L19.5 21Z" fill="white"/>
      <path d="M28.5 11.2C28 11 27.2 10.8 26.2 10.8C23.7 10.8 22 12.1 22 13.9C22 15.2 23.2 15.9 24 16.4C24.9 16.9 25.2 17.2 25.2 17.6C25.2 18.2 24.5 18.5 23.8 18.5C22.8 18.5 22.3 18.4 21.5 18L21.2 17.9L20.8 20.2C21.4 20.5 22.5 20.7 23.7 20.7C26.4 20.7 28 19.4 28.1 17.5C28.1 16.5 27.5 15.7 26.2 15.1C25.4 14.7 25 14.4 25 14C25 13.6 25.4 13.2 26.3 13.2C27 13.2 27.6 13.3 28 13.5L28.3 13.6L28.5 11.2Z" fill="white"/>
      <path d="M32.5 11H30.6C30 11 29.5 11.2 29.3 11.8L25.8 21H28.5L29 19.6H32.2L32.5 21H35L32.5 11ZM29.8 17.5L31 14.2L31.7 17.5H29.8Z" fill="white"/>
      <path d="M16.5 11L14 17.8L13.7 16.3C13.2 14.8 11.8 13.2 10.2 12.4L12.5 21H15.2L19.2 11H16.5Z" fill="white"/>
      <path d="M12.5 11H8.5L8.5 11.2C11.7 12 13.8 13.8 14.5 16L13.7 11.8C13.6 11.2 13.1 11 12.5 11Z" fill="#F9A533"/>
    </svg>
  );
}

function MastercardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#252525"/>
      <circle cx="19" cy="16" r="8" fill="#EB001B"/>
      <circle cx="29" cy="16" r="8" fill="#F79E1B"/>
      <path d="M24 9.8C25.8 11.2 27 13.5 27 16C27 18.5 25.8 20.8 24 22.2C22.2 20.8 21 18.5 21 16C21 13.5 22.2 11.2 24 9.8Z" fill="#FF5F00"/>
    </svg>
  );
}

function AmexIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#006FCF"/>
      <path d="M8 14L10.5 8H13.5L16 14H13.8L13.2 12.6H10.8L10.2 14H8ZM11.3 11.2L12 12.6H12.8L12 11.2L11.3 11.2Z" fill="white"/>
      <text x="10" y="23" fill="white" fontSize="7" fontWeight="bold" fontFamily="Arial">AMEX</text>
    </svg>
  );
}

function DinersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="32" rx="4" fill="#0079BE"/>
      <circle cx="24" cy="16" r="10" fill="white"/>
      <circle cx="24" cy="16" r="8.5" fill="none" stroke="#0079BE" strokeWidth="1.5"/>
      <path d="M20 12V20C18.3 19 17.2 17.1 17.2 16C17.2 14.9 18.3 13 20 12Z" fill="#0079BE"/>
      <path d="M28 12V20C29.7 19 30.8 17.1 30.8 16C30.8 14.9 29.7 13 28 12Z" fill="#0079BE"/>
    </svg>
  );
}

function CardBrandIcon({ brand, className }: { brand: CardBrand; className?: string }) {
  switch (brand) {
    case "visa": return <VisaIcon className={className} />;
    case "mastercard": return <MastercardIcon className={className} />;
    case "amex": return <AmexIcon className={className} />;
    case "diners": return <DinersIcon className={className} />;
    default: return null;
  }
}

function CulqiLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 80 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="18" fill="#00BFA6" fontSize="18" fontWeight="bold" fontFamily="Arial, sans-serif" letterSpacing="-0.5">culqi</text>
    </svg>
  );
}

export function PaymentDialog({
  open,
  onClose,
  onSuccess,
  amountDisplay,
  description,
}: PaymentDialogProps) {
  const [form, setForm] = useState<CardForm>({
    number: "",
    month: "",
    year: "",
    cvv: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleChange = useCallback(
    (field: keyof CardForm, value: string) => {
      setError(null);
      if (field === "number") {
        setForm((f) => ({ ...f, number: formatCardNumber(value) }));
      } else if (field === "month") {
        const digits = value.replace(/\D/g, "").slice(0, 2);
        setForm((f) => ({ ...f, month: digits }));
      } else if (field === "year") {
        const digits = value.replace(/\D/g, "").slice(0, 4);
        setForm((f) => ({ ...f, year: digits }));
      } else if (field === "cvv") {
        const digits = value.replace(/\D/g, "").slice(0, 4);
        setForm((f) => ({ ...f, cvv: digits }));
      } else {
        setForm((f) => ({ ...f, [field]: value }));
      }
    },
    [],
  );

  const validate = (): string | null => {
    const cardNum = form.number.replace(/\s/g, "");
    if (cardNum.length < 13) return "Número de tarjeta inválido";
    if (!form.month || parseInt(form.month) < 1 || parseInt(form.month) > 12)
      return "Mes inválido (01-12)";
    if (!form.year || form.year.length < 4)
      return "Año inválido (ej: 2030)";
    if (form.cvv.length < 3) return "CVV inválido";
    if (!form.email || !form.email.includes("@"))
      return "Email inválido";
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const culqiPublicKey =
        process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY ?? "";

      console.log("[PaymentDialog] Creating token with Culqi...");

      const res = await fetch("https://secure.culqi.com/v2/tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${culqiPublicKey}`,
        },
        body: JSON.stringify({
          card_number: form.number.replace(/\s/g, ""),
          cvv: form.cvv,
          expiration_month: form.month.padStart(2, "0"),
          expiration_year: form.year,
          email: form.email,
        }),
      });

      const data = await res.json();
      console.log("[PaymentDialog] Culqi token response:", res.status, data);

      if (!res.ok) {
        throw new Error(
          data.user_message ?? data.merchant_message ?? "Error al procesar la tarjeta",
        );
      }

      onSuccess(data.id);
    } catch (err) {
      console.error("[PaymentDialog] Error:", err);
      const msg =
        err instanceof Error ? err.message : "Error de conexión";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const cardBrand = getCardBrand(form.number);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="relative w-full max-w-[440px] mx-4 overflow-hidden rounded-2xl border border-[#27272A] bg-[#141416] shadow-2xl"
        style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}
      >
        {/* ── Top Bar: Culqi branding ── */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#0D0D0F] border-b border-[#1E1E22]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#00BFA6]" />
            <span className="text-[12px] font-medium text-[#00BFA6]">
              Pago seguro
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#52525B]">Procesado por</span>
            <CulqiLogo className="h-4 w-auto" />
          </div>
        </div>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex flex-col">
            <span className="text-[13px] text-[#71717A]">{description}</span>
            <span className="font-heading text-[32px] font-bold text-[#FAFAFA] leading-tight">
              {amountDisplay}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#52525B] hover:bg-[#1E1E22] hover:text-[#FAFAFA] transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Accepted cards strip ── */}
        <div className="flex items-center gap-2 px-6 pb-4">
          <span className="text-[11px] text-[#52525B] mr-1">Aceptamos</span>
          <VisaIcon className="h-[22px] w-auto rounded-[3px]" />
          <MastercardIcon className="h-[22px] w-auto rounded-[3px]" />
          <AmexIcon className="h-[22px] w-auto rounded-[3px]" />
          <DinersIcon className="h-[22px] w-auto rounded-[3px]" />
        </div>

        <div className="h-px bg-[#1E1E22]" />

        {/* ── Form ── */}
        <div className="flex flex-col gap-4 px-6 py-5">
          {/* Card Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-[#A1A1AA]">
              Número de tarjeta
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-number"
                placeholder="0000 0000 0000 0000"
                value={form.number}
                onChange={(e) => handleChange("number", e.target.value)}
                disabled={loading}
                className="h-[44px] w-full rounded-xl border border-[#27272A] bg-[#0D0D0F] pl-4 pr-14 text-[15px] text-[#FAFAFA] placeholder-[#3F3F46] outline-none transition-all focus:border-[#00BFA6]/60 focus:ring-1 focus:ring-[#00BFA6]/20 disabled:opacity-50 font-mono tracking-wider"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {cardBrand ? (
                  <CardBrandIcon brand={cardBrand} className="h-[24px] w-auto" />
                ) : (
                  <div className="flex gap-1 opacity-30">
                    <VisaIcon className="h-[18px] w-auto" />
                    <MastercardIcon className="h-[18px] w-auto" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Expiry + CVV row */}
          <div className="grid grid-cols-[1fr_1fr_100px] gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#A1A1AA]">
                Mes
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-exp-month"
                placeholder="MM"
                value={form.month}
                onChange={(e) => handleChange("month", e.target.value)}
                disabled={loading}
                className="h-[44px] w-full rounded-xl border border-[#27272A] bg-[#0D0D0F] px-4 text-[15px] text-[#FAFAFA] placeholder-[#3F3F46] outline-none transition-all focus:border-[#00BFA6]/60 focus:ring-1 focus:ring-[#00BFA6]/20 disabled:opacity-50 text-center font-mono"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#A1A1AA]">
                Año
              </label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="cc-exp-year"
                placeholder="AAAA"
                value={form.year}
                onChange={(e) => handleChange("year", e.target.value)}
                disabled={loading}
                className="h-[44px] w-full rounded-xl border border-[#27272A] bg-[#0D0D0F] px-4 text-[15px] text-[#FAFAFA] placeholder-[#3F3F46] outline-none transition-all focus:border-[#00BFA6]/60 focus:ring-1 focus:ring-[#00BFA6]/20 disabled:opacity-50 text-center font-mono"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-[#A1A1AA]">
                CVV
              </label>
              <div className="relative">
                <input
                  type="password"
                  inputMode="numeric"
                  autoComplete="cc-csc"
                  placeholder="•••"
                  value={form.cvv}
                  onChange={(e) => handleChange("cvv", e.target.value)}
                  disabled={loading}
                  className="h-[44px] w-full rounded-xl border border-[#27272A] bg-[#0D0D0F] px-4 text-[15px] text-[#FAFAFA] placeholder-[#3F3F46] outline-none transition-all focus:border-[#00BFA6]/60 focus:ring-1 focus:ring-[#00BFA6]/20 disabled:opacity-50 text-center font-mono"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-[#3F3F46]" />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-[#A1A1AA]">
              Email del comprobante
            </label>
            <input
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              disabled={loading}
              className="h-[44px] w-full rounded-xl border border-[#27272A] bg-[#0D0D0F] px-4 text-[15px] text-[#FAFAFA] placeholder-[#3F3F46] outline-none transition-all focus:border-[#00BFA6]/60 focus:ring-1 focus:ring-[#00BFA6]/20 disabled:opacity-50"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-[#F87171]/8 border border-[#F87171]/15 px-4 py-3">
              <span className="text-[14px] mt-px">⚠</span>
              <p className="text-[13px] text-[#F87171] leading-relaxed">{error}</p>
            </div>
          )}

          {/* Pay Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="mt-1 flex h-[48px] w-full items-center justify-center gap-2.5 rounded-xl text-[15px] font-semibold transition-all disabled:opacity-50"
            style={{
              background: loading ? "#27272A" : "linear-gradient(135deg, #BEFF00 0%, #9ECC00 100%)",
              color: loading ? "#A1A1AA" : "#09090B",
            }}
          >
            {loading ? (
              <>
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
                Procesando pago...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                Pagar {amountDisplay}
              </>
            )}
          </button>
        </div>

        {/* ── Bottom: Security badges ── */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#0D0D0F] border-t border-[#1E1E22]">
          <div className="flex items-center gap-1.5">
            <Lock className="h-3 w-3 text-[#3F3F46]" />
            <span className="text-[10px] text-[#3F3F46]">
              Encriptación SSL 256-bit
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-[#3F3F46]" />
            <span className="text-[10px] text-[#3F3F46]">
              PCI DSS Compliant
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
