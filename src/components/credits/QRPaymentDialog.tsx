"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { X, Loader2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

interface QRPaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (credits: number) => void;
  packageId: string;
  quantity?: number;
  amountDisplay: string;
  description: string;
}

type OrderState = "idle" | "creating" | "waiting" | "paid" | "expired" | "error";

export function QRPaymentDialog({
  open,
  onClose,
  onSuccess,
  packageId,
  quantity,
  amountDisplay,
  description,
}: QRPaymentDialogProps) {
  const [state, setState] = useState<OrderState>("idle");
  const [qrValue, setQrValue] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const createdRef = useRef(false);

  const cleanup = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const createOrder = useCallback(async () => {
    if (createdRef.current) return;
    createdRef.current = true;

    setState("creating");
    setError(null);

    try {
      const res = await fetch("/api/culqi/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          package_id: packageId,
          ...(packageId === "sueltos" && quantity ? { quantity } : {}),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message ?? data.error ?? "Error al crear orden");
      }

      // Use the QR image/url from Culqi, or the payment URL for QR generation
      const qrContent = data.qr ?? data.url;
      setQrValue(qrContent);
      setState("waiting");

      // 30 min countdown
      const expiresAt = data.expires_at * 1000;
      setTimeLeft(Math.max(0, Math.floor((expiresAt - Date.now()) / 1000)));

      timerRef.current = setInterval(() => {
        const remaining = Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
        setTimeLeft(remaining);
        if (remaining <= 0) {
          setState("expired");
          cleanup();
        }
      }, 1000);

      // Poll every 5s
      pollRef.current = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/culqi/order/${data.order_id}`);
          const pollData = await pollRes.json();

          if (pollData.state === "paid") {
            setState("paid");
            cleanup();
            setTimeout(() => {
              onSuccess(pollData.credits);
            }, 2000);
          } else if (pollData.state === "expired") {
            setState("expired");
            cleanup();
          }
        } catch {
          // Silently retry on next interval
        }
      }, 5000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error de conexión";
      setError(msg);
      setState("error");
      createdRef.current = false;
    }
  }, [packageId, quantity, onSuccess, cleanup]);

  useEffect(() => {
    if (open && state === "idle") {
      createOrder();
    }
  }, [open, state, createOrder]);

  useEffect(() => {
    if (!open) {
      cleanup();
      setState("idle");
      setQrValue(null);
      setError(null);
      setTimeLeft(0);
      createdRef.current = false;
    }
  }, [open, cleanup]);

  if (!open) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={state === "creating" ? undefined : onClose}
      />

      <div className="relative w-full max-w-[420px] mx-4 overflow-hidden rounded-2xl border border-[#27272A] bg-[#141416] shadow-2xl">
        {/* Header with Yape/Plin branding */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E1E22] bg-[#0D0D0F]">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-full bg-[#6C2EB9] px-2.5 py-0.5 text-[11px] font-bold text-white">
                YAPE
              </span>
              <span className="text-[11px] text-[#52525B]">/</span>
              <span className="inline-flex items-center rounded-full bg-[#00D1A1] px-2.5 py-0.5 text-[11px] font-bold text-white">
                PLIN
              </span>
            </div>
            <span className="text-[14px] font-medium text-[#A1A1AA]">
              Pago QR
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={state === "creating"}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#52525B] hover:bg-[#1E1E22] hover:text-[#FAFAFA] transition-colors disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col items-center px-6 py-6 gap-4">
          {/* Creating state */}
          {state === "creating" && (
            <div className="flex flex-col items-center gap-3 py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#A78BFA]" />
              <p className="text-[14px] text-[#A1A1AA]">Generando código QR...</p>
            </div>
          )}

          {/* Waiting - show QR code directly */}
          {state === "waiting" && (
            <>
              {/* Amount + description */}
              <div className="text-center">
                <p className="font-heading text-[32px] font-bold text-[#FAFAFA] leading-tight">
                  {amountDisplay}
                </p>
                <p className="text-[13px] text-[#71717A] mt-1">{description}</p>
              </div>

              {/* QR Code */}
              <div className="rounded-2xl bg-white p-4">
                {qrValue ? (
                  <QRCodeSVG
                    value={qrValue}
                    size={220}
                    level="M"
                    bgColor="#FFFFFF"
                    fgColor="#000000"
                  />
                ) : (
                  <div className="flex h-[220px] w-[220px] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-[#71717A]" />
                  </div>
                )}
              </div>

              {/* Instructions */}
              <p className="text-[13px] text-[#A1A1AA] text-center leading-relaxed max-w-[300px]">
                Abre tu app de <strong className="text-[#A78BFA]">Yape</strong> o{" "}
                <strong className="text-[#00D1A1]">Plin</strong> y escanea este código QR para pagar
              </p>

              {/* Timer */}
              <div className="flex items-center gap-2 rounded-lg bg-[#0D0D0F] border border-[#1E1E22] px-4 py-2">
                <Clock className="h-3.5 w-3.5 text-[#71717A]" />
                <span className="text-[13px] text-[#71717A]">
                  Expira en{" "}
                  <span className="font-mono font-medium text-[#FAFAFA]">
                    {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                  </span>
                </span>
              </div>

              {/* Polling indicator */}
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#BEFF00] animate-pulse" />
                <span className="text-[12px] text-[#52525B]">
                  Esperando confirmación de pago...
                </span>
              </div>
            </>
          )}

          {/* Paid */}
          {state === "paid" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <CheckCircle2 className="h-14 w-14 text-[#BEFF00]" />
              <p className="font-heading text-[20px] font-semibold text-[#FAFAFA]">
                ¡Pago confirmado!
              </p>
              <p className="text-[13px] text-[#71717A]">
                Tus créditos se están acreditando...
              </p>
            </div>
          )}

          {/* Expired */}
          {state === "expired" && (
            <div className="flex flex-col items-center gap-3 py-8">
              <XCircle className="h-14 w-14 text-[#F87171]" />
              <p className="font-heading text-[18px] font-semibold text-[#FAFAFA]">
                Código QR expirado
              </p>
              <p className="text-[13px] text-[#71717A] text-center max-w-[280px]">
                El tiempo para completar el pago ha expirado. Intenta de nuevo.
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 inline-flex items-center justify-center rounded-xl h-[40px] px-6 border border-[#27272A] text-[13px] font-medium text-[#FAFAFA] hover:bg-[#1E1E22] transition-colors"
              >
                Cerrar
              </button>
            </div>
          )}

          {/* Error */}
          {state === "error" && error && (
            <div className="flex flex-col items-center gap-3 py-8">
              <XCircle className="h-14 w-14 text-[#F87171]" />
              <p className="text-[14px] text-[#F87171] text-center">{error}</p>
              <button
                type="button"
                onClick={() => {
                  setState("idle");
                  createdRef.current = false;
                }}
                className="mt-2 inline-flex items-center justify-center rounded-xl h-[40px] px-6 bg-[#BEFF00] text-[13px] font-semibold text-[#09090B] hover:opacity-90 transition-opacity"
              >
                Reintentar
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        {state === "waiting" && (
          <div className="flex items-center justify-center px-6 py-3 bg-[#0D0D0F] border-t border-[#1E1E22]">
            <p className="text-[11px] text-[#3F3F46] text-center">
              El pago se confirma automáticamente · Procesado por Culqi
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
