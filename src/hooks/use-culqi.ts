"use client";

import { useCallback, useRef, useState } from "react";

interface CulqiCheckoutOptions {
  title: string;
  currency: string;
  amount: number; // In centimos
  description: string;
  metadata?: Record<string, string>;
}

type CulqiStatus = "idle" | "loading" | "success" | "error";

interface UseCulqiReturn {
  openCheckout: (options: CulqiCheckoutOptions) => void;
  status: CulqiStatus;
  error: string | null;
  reset: () => void;
}

declare global {
  interface Window {
    Culqi?: {
      publicKey: string;
      settings: (settings: Record<string, unknown>) => void;
      options: (options: Record<string, unknown>) => void;
      open: () => void;
      close: () => void;
      token: { id: string; email: string } | null;
      order: unknown;
    };
    culpiCallback?: () => void;
  }
}

const CULQI_JS_URL = "https://checkout.culqi.com/js/v4";

function loadCulqiScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById("culqi-js")) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = "culqi-js";
    script.src = CULQI_JS_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Culqi checkout"));
    document.head.appendChild(script);
  });
}

export function useCulqi(
  onTokenCreated: (tokenId: string, email: string) => Promise<void>,
): UseCulqiReturn {
  const [status, setStatus] = useState<CulqiStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const callbackRef = useRef(onTokenCreated);
  callbackRef.current = onTokenCreated;

  const openCheckout = useCallback(
    async (options: CulqiCheckoutOptions) => {
      setStatus("loading");
      setError(null);

      try {
        await loadCulqiScript();

        if (!window.Culqi) {
          throw new Error("Culqi not available");
        }

        window.Culqi.publicKey =
          process.env.NEXT_PUBLIC_CULQI_PUBLIC_KEY ?? "";

        window.Culqi.settings({
          title: options.title,
          currency: options.currency,
          amount: options.amount,
          description: options.description,
          ...(options.metadata && { metadata: options.metadata }),
        });

        window.Culqi.options({
          lang: "es",
          installments: false,
          paymentMethods: {
            tarjeta: true,
            yape: true,
            billetera: false,
            bancaMovil: false,
            agente: false,
            cuotealo: false,
          },
          style: {
            logo: "",
            bannerColor: "#09090B",
            buttonBackground: "#BEFF00",
            menuColor: "#BEFF00",
            linksColor: "#BEFF00",
            buttonText: "Pagar",
            buttonTextColor: "#09090B",
            priceColor: "#FAFAFA",
          },
        });

        // Global callback that Culqi calls when token is created
        window.culpiCallback = async () => {
          if (window.Culqi?.token) {
            const { id, email } = window.Culqi.token;
            try {
              await callbackRef.current(id, email);
              setStatus("success");
            } catch (err) {
              const msg =
                err instanceof Error ? err.message : "Payment failed";
              setError(msg);
              setStatus("error");
            }
          } else {
            setError("No token received from Culqi");
            setStatus("error");
          }
        };

        // Culqi calls window.culpiCallback when done
        // We also set the global Culqi callback
        (window as unknown as Record<string, unknown>)["culqi"] = () => {
          if (window.Culqi?.token) {
            window.culpiCallback?.();
          } else {
            setError("Payment was cancelled");
            setStatus("idle");
          }
        };

        window.Culqi.open();
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to open checkout";
        setError(msg);
        setStatus("error");
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  return { openCheckout, status, error, reset };
}
