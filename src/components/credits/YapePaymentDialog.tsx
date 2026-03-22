"use client";

import { useState, useCallback, useRef } from "react";
import { X, Loader2, Smartphone, KeyRound } from "lucide-react";

interface YapePaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (tokenId: string) => void;
  amountInCentimos: number;
  amountDisplay: string;
  description: string;
}

export function YapePaymentDialog({
  open,
  onClose,
  onSuccess,
  amountInCentimos,
  amountDisplay,
  description,
}: YapePaymentDialogProps) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const otpRef = useRef<HTMLInputElement>(null);

  const handlePhoneChange = useCallback((value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 9);
    setPhone(digits);
    setError(null);
    if (digits.length === 9) {
      otpRef.current?.focus();
    }
  }, []);

  const handleOtpChange = useCallback((value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 6);
    setOtp(digits);
    setError(null);
  }, []);

  const validate = (): string | null => {
    if (phone.length !== 9) return "Ingresa un número de celular de 9 dígitos";
    if (!phone.startsWith("9")) return "El número debe empezar con 9";
    if (otp.length !== 6) return "El código de aprobación debe tener 6 dígitos";
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
      const culqiPublicKey = process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY ?? "";

      const res = await fetch("https://api.culqi.com/v2/tokens/yape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${culqiPublicKey}`,
        },
        body: JSON.stringify({
          number_phone: phone,
          otp: otp,
          amount: String(amountInCentimos),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.user_message ?? data.merchant_message ?? "Error al procesar el pago con Yape",
        );
      }

      onSuccess(data.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error de conexión";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = useCallback(() => {
    if (!loading) {
      setPhone("");
      setOtp("");
      setError(null);
      onClose();
    }
  }, [loading, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div
        className="relative w-full max-w-[420px] mx-4 overflow-hidden rounded-2xl border border-[#27272A] bg-[#141416] shadow-2xl"
        style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.5)" }}
      >
        {/* Header with Yape branding */}
        <div className="flex items-center justify-between px-6 py-3 bg-[#0D0D0F] border-b border-[#1E1E22]">
          <div className="flex items-center gap-2.5">
            {/* Yape purple dot */}
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6C2EB9]">
              <span className="text-[10px] font-bold text-white">Y</span>
            </div>
            <span className="text-[13px] font-semibold text-[#FAFAFA]">
              Pagar con Yape
            </span>
          </div>
          <span className="text-[11px] text-[#52525B]">Código de aprobación</span>
        </div>

        {/* Amount */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div className="flex flex-col">
            <span className="text-[13px] text-[#71717A]">{description}</span>
            <span className="font-heading text-[32px] font-bold text-[#FAFAFA] leading-tight">
              {amountDisplay}
            </span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#52525B] hover:bg-[#1E1E22] hover:text-[#FAFAFA] transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="h-px bg-[#1E1E22]" />

        {/* Form */}
        <div className="flex flex-col gap-4 px-6 py-5">
          {/* Phone */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-[#A1A1AA]">
              Número de celular
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                <Smartphone className="h-4 w-4 text-[#52525B]" />
              </div>
              <input
                type="tel"
                inputMode="numeric"
                placeholder="912 345 678"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                disabled={loading}
                className="h-[44px] w-full rounded-xl border border-[#27272A] bg-[#0D0D0F] pl-10 pr-4 text-[15px] text-[#FAFAFA] placeholder-[#3F3F46] outline-none transition-all focus:border-[#6C2EB9]/60 focus:ring-1 focus:ring-[#6C2EB9]/20 disabled:opacity-50 font-mono tracking-widest"
              />
              {phone.length === 9 && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 rounded-full bg-[#BEFF00] flex items-center justify-center">
                    <svg className="h-2.5 w-2.5 text-[#09090B]" viewBox="0 0 16 16" fill="none"><path d="M3.5 8.5L6.5 11.5L12.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* OTP Code */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-medium text-[#A1A1AA]">
              Código de aprobación
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                <KeyRound className="h-4 w-4 text-[#52525B]" />
              </div>
              <input
                ref={otpRef}
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={otp}
                onChange={(e) => handleOtpChange(e.target.value)}
                disabled={loading}
                maxLength={6}
                className="h-[44px] w-full rounded-xl border border-[#27272A] bg-[#0D0D0F] pl-10 pr-4 text-[15px] text-[#FAFAFA] placeholder-[#3F3F46] outline-none transition-all focus:border-[#6C2EB9]/60 focus:ring-1 focus:ring-[#6C2EB9]/20 disabled:opacity-50 font-mono tracking-[0.5em] text-center"
              />
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-xl bg-[#6C2EB9]/5 border border-[#6C2EB9]/15 px-4 py-3">
            <p className="text-[12px] text-[#A78BFA] leading-relaxed">
              <strong className="text-[#C4B5FD]">¿Cómo obtener el código?</strong>
              <br />
              Abre tu app Yape → Menú → <strong>Código de aprobación</strong>
              <br />
              <span className="text-[#7C3AED]/70">El código vence en 2 minutos</span>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-[#F87171]/5 border border-[#F87171]/20 px-4 py-3">
              <p className="text-[13px] text-[#F87171]">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || phone.length !== 9 || otp.length !== 6}
            className="relative h-[48px] w-full rounded-xl text-[15px] font-semibold transition-all disabled:opacity-40 overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #6C2EB9 0%, #9333EA 100%)",
              color: "#FFFFFF",
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Procesando...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Pagar {amountDisplay} con Yape
              </span>
            )}
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center px-6 py-3 bg-[#0D0D0F] border-t border-[#1E1E22]">
          <p className="text-[11px] text-[#3F3F46] text-center">
            Pago procesado de forma segura · Procesado por Culqi
          </p>
        </div>
      </div>
    </div>
  );
}
