"use client";

import { useState, useCallback } from "react";
import {
  Check,
  Minus,
  Plus,
  Zap,
  CreditCard,
  QrCode,
  Smartphone,
  ChevronLeft,
  X,
} from "lucide-react";
import {
  CREDIT_PACKAGES,
  calcularPrecioSueltos,
} from "@/src/lib/config/credit-packages";
import type { CreditPackage } from "@/src/lib/config/credit-packages";
import { PaymentDialog } from "./PaymentDialog";
import { QRPaymentDialog } from "./QRPaymentDialog";
import { YapePaymentDialog } from "./YapePaymentDialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type PickerStep = "main" | "wallets";

export function BuyCreditsSection() {
  const router = useRouter();
  const [selectedPkg, setSelectedPkg] = useState<CreditPackage | null>(null);
  const [sueltosQty, setSueltosQty] = useState(10);
  const [processing, setProcessing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [yapeDialogOpen, setYapeDialogOpen] = useState(false);
  const [methodPickerOpen, setMethodPickerOpen] = useState(false);
  const [pickerStep, setPickerStep] = useState<PickerStep>("main");

  const getAmountForPkg = useCallback(
    (pkg: CreditPackage) => {
      if (pkg.id === "sueltos") {
        return calcularPrecioSueltos(sueltosQty);
      }
      return { priceInSoles: pkg.priceInSoles, priceInCentimos: pkg.priceInCentimos };
    },
    [sueltosQty],
  );

  const handleBuy = useCallback((pkg: CreditPackage) => {
    setSelectedPkg(pkg);
    setPickerStep("main");
    setMethodPickerOpen(true);
  }, []);

  const closePicker = useCallback(() => {
    setMethodPickerOpen(false);
    setPickerStep("main");
  }, []);

  const handleTokenSuccess = useCallback(
    async (tokenId: string) => {
      if (!selectedPkg) return;
      setProcessing(true);
      setDialogOpen(false);
      setYapeDialogOpen(false);

      try {
        const res = await fetch("/api/culqi/charge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token_id: tokenId,
            package_id: selectedPkg.id,
            ...(selectedPkg.id === "sueltos" && { quantity: sueltosQty }),
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message ?? data.error ?? "Payment failed");

        toast.success(`¡${data.credits} créditos añadidos a tu cuenta!`);
        router.refresh();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Payment failed");
      } finally {
        setProcessing(false);
      }
    },
    [selectedPkg, sueltosQty, router],
  );

  const handleQRSuccess = useCallback(
    (credits: number) => {
      setQrDialogOpen(false);
      toast.success(`¡${credits} créditos añadidos a tu cuenta!`);
      router.refresh();
    },
    [router],
  );

  const sueltosPackage = CREDIT_PACKAGES.find((p) => p.id === "sueltos")!;
  const fixedPackages = CREDIT_PACKAGES.filter((p) => p.id !== "sueltos");

  return (
    <div className="flex flex-col gap-5">
      {/* Fixed Packages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {fixedPackages.map((pkg) => (
          <PackageCard
            key={pkg.id}
            pkg={pkg}
            loading={processing}
            onBuy={() => handleBuy(pkg)}
          />
        ))}
      </div>

      {/* Sueltos Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-[#27272A] bg-[#18181B] px-5 py-5 sm:px-8">
        <div className="flex flex-col gap-1">
          <span className="font-heading text-[16px] font-semibold text-[#FAFAFA]">
            Créditos sueltos
          </span>
          <span className="text-[13px] text-[#71717A]">S/ 0.50 por crédito — mínimo 10</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-0 rounded-lg border border-[#27272A] bg-[#09090B]">
            <button
              type="button"
              onClick={() => setSueltosQty((q) => Math.max(10, q - 10))}
              disabled={sueltosQty <= 10}
              className="flex h-9 w-9 items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] disabled:opacity-30 transition-colors"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="w-12 text-center font-heading text-[15px] font-semibold text-[#FAFAFA]">
              {sueltosQty}
            </span>
            <button
              type="button"
              onClick={() => setSueltosQty((q) => q + 10)}
              className="flex h-9 w-9 items-center justify-center text-[#A1A1AA] hover:text-[#FAFAFA] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <span className="font-heading text-[18px] font-bold text-[#FAFAFA] min-w-[80px] text-right">
            S/ {calcularPrecioSueltos(sueltosQty).priceInSoles.toFixed(2)}
          </span>
          <button
            type="button"
            onClick={() => handleBuy(sueltosPackage)}
            disabled={processing}
            className="inline-flex items-center justify-center gap-2 rounded-[10px] h-[38px] px-4 bg-[#BEFF00] text-[13px] font-semibold text-[#09090B] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Zap className="h-3.5 w-3.5" />
            Comprar
          </button>
        </div>
      </div>

      {/* Test Info */}
      <div className="rounded-xl border border-[#27272A]/50 bg-[#18181B]/50 px-5 py-4">
        <p className="text-[12px] text-[#52525B]">
          <span className="text-[#71717A] font-medium">Modo test:</span>{" "}
          Tarjeta: 4111 1111 1111 1111 (CVV: 123, Venc: 12/30) · Yape: celular 900000001, código: cualquier 6 dígitos.
        </p>
      </div>

      {/* Payment Dialog (Card) */}
      {selectedPkg && (
        <PaymentDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSuccess={handleTokenSuccess}
          amount={getAmountForPkg(selectedPkg).priceInCentimos}
          amountDisplay={`S/ ${getAmountForPkg(selectedPkg).priceInSoles.toFixed(2)}`}
          description={
            selectedPkg.id === "sueltos"
              ? `${sueltosQty} créditos sueltos`
              : `${selectedPkg.name} — ${selectedPkg.credits} créditos`
          }
        />
      )}

      {/* QR Payment Dialog */}
      {selectedPkg && (
        <QRPaymentDialog
          open={qrDialogOpen}
          onClose={() => setQrDialogOpen(false)}
          onSuccess={handleQRSuccess}
          packageId={selectedPkg.id}
          quantity={selectedPkg.id === "sueltos" ? sueltosQty : undefined}
          amountDisplay={`S/ ${getAmountForPkg(selectedPkg).priceInSoles.toFixed(2)}`}
          description={
            selectedPkg.id === "sueltos"
              ? `${sueltosQty} créditos sueltos`
              : `${selectedPkg.name} — ${selectedPkg.credits} créditos`
          }
        />
      )}

      {/* Yape Approval Code Dialog */}
      {selectedPkg && (
        <YapePaymentDialog
          open={yapeDialogOpen}
          onClose={() => setYapeDialogOpen(false)}
          onSuccess={handleTokenSuccess}
          amountInCentimos={getAmountForPkg(selectedPkg).priceInCentimos}
          amountDisplay={`S/ ${getAmountForPkg(selectedPkg).priceInSoles.toFixed(2)}`}
          description={
            selectedPkg.id === "sueltos"
              ? `${sueltosQty} créditos sueltos`
              : `${selectedPkg.name} — ${selectedPkg.credits} créditos`
          }
        />
      )}

      {/* Payment Method Picker — 2-level */}
      {methodPickerOpen && selectedPkg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={closePicker}
          />
          <div className="relative w-full max-w-[400px] mx-4 rounded-2xl border border-[#27272A] bg-[#141416] shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E1E22]">
              <div className="flex items-center gap-2">
                {pickerStep === "wallets" && (
                  <button
                    type="button"
                    onClick={() => setPickerStep("main")}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-[#52525B] hover:bg-[#1E1E22] hover:text-[#FAFAFA] transition-colors mr-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                )}
                <span className="font-heading text-[16px] font-semibold text-[#FAFAFA]">
                  {pickerStep === "main" ? "Método de pago" : "Yape / Plin"}
                </span>
              </div>
              <button
                type="button"
                onClick={closePicker}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#52525B] hover:bg-[#1E1E22] hover:text-[#FAFAFA] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex flex-col gap-3 p-6">
              <p className="text-[13px] text-[#71717A] -mt-1 mb-1">
                {selectedPkg.id === "sueltos"
                  ? `${sueltosQty} créditos sueltos — S/ ${getAmountForPkg(selectedPkg).priceInSoles.toFixed(2)}`
                  : `${selectedPkg.name} — ${selectedPkg.credits} créditos — S/ ${getAmountForPkg(selectedPkg).priceInSoles.toFixed(2)}`}
              </p>

              {pickerStep === "main" && (
                <>
                  <button
                    type="button"
                    onClick={() => { closePicker(); setDialogOpen(true); }}
                    className="flex items-center gap-4 rounded-xl border border-[#27272A] bg-[#0D0D0F] px-5 py-4 hover:border-[#BEFF00]/40 hover:bg-[#BEFF00]/5 transition-all group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#27272A] group-hover:bg-[#BEFF00]/15 transition-colors">
                      <CreditCard className="h-5 w-5 text-[#A1A1AA] group-hover:text-[#BEFF00] transition-colors" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-[14px] font-semibold text-[#FAFAFA]">Tarjeta de crédito / débito</span>
                      <span className="text-[12px] text-[#52525B]">Visa, Mastercard, Amex, Diners</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPickerStep("wallets")}
                    className="flex items-center gap-4 rounded-xl border border-[#27272A] bg-[#0D0D0F] px-5 py-4 hover:border-[#6C2EB9]/40 hover:bg-[#6C2EB9]/5 transition-all group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#27272A] group-hover:bg-[#6C2EB9]/15 transition-colors">
                      <Smartphone className="h-5 w-5 text-[#A1A1AA] group-hover:text-[#A78BFA] transition-colors" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-[14px] font-semibold text-[#FAFAFA]">Yape / Plin</span>
                      <span className="text-[12px] text-[#52525B]">
                        Billeteras digitales —&nbsp;
                        <span className="inline-flex items-center gap-1">
                          <span className="rounded-full bg-[#6C2EB9] px-1.5 py-0 text-[9px] font-bold text-white">YAPE</span>
                          <span className="rounded-full bg-[#00D1A1] px-1.5 py-0 text-[9px] font-bold text-white">PLIN</span>
                        </span>
                      </span>
                    </div>
                    <ChevronLeft className="ml-auto h-4 w-4 rotate-180 text-[#52525B] group-hover:text-[#A78BFA] transition-colors" />
                  </button>
                </>
              )}

              {pickerStep === "wallets" && (
                <>
                  <button
                    type="button"
                    onClick={() => { closePicker(); setQrDialogOpen(true); }}
                    className="flex items-center gap-4 rounded-xl border border-[#27272A] bg-[#0D0D0F] px-5 py-4 hover:border-[#6C2EB9]/40 hover:bg-[#6C2EB9]/5 transition-all group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#27272A] group-hover:bg-[#6C2EB9]/15 transition-colors">
                      <QrCode className="h-5 w-5 text-[#A1A1AA] group-hover:text-[#A78BFA] transition-colors" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-[14px] font-semibold text-[#FAFAFA]">Generar código QR</span>
                      <span className="text-[12px] text-[#52525B]">Escanea con Yape, Plin u otra billetera</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => { closePicker(); setYapeDialogOpen(true); }}
                    className="flex items-center gap-4 rounded-xl border border-[#27272A] bg-[#0D0D0F] px-5 py-4 hover:border-[#6C2EB9]/40 hover:bg-[#6C2EB9]/5 transition-all group"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#27272A] group-hover:bg-[#6C2EB9]/15 transition-colors">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#6C2EB9]">
                        <span className="text-[10px] font-bold text-white">Y</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-[14px] font-semibold text-[#FAFAFA]">Código de aprobación</span>
                      <span className="text-[12px] text-[#52525B]">Yape → Menú → Código de aprobación</span>
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Processing overlay */}
      {processing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-[#27272A] bg-[#18181B] px-8 py-6">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#BEFF00] border-t-transparent" />
            <span className="text-[14px] text-[#FAFAFA]">Procesando pago...</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Package Card ───

interface PackageCardProps {
  pkg: CreditPackage;
  loading: boolean;
  onBuy: () => void;
}

function PackageCard({ pkg, loading, onBuy }: PackageCardProps) {
  return (
    <div
      className="relative flex flex-col rounded-2xl border bg-[#18181B] px-5 py-5 transition-all"
      style={{
        borderColor: pkg.popular ? "#BEFF00" : "#27272A",
        boxShadow: pkg.popular ? "0 0 32px 0 #BEFF0015" : "none",
      }}
    >
      {pkg.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center rounded-full bg-[#BEFF00] px-3 py-0.5 text-[11px] font-bold text-[#09090B]">
            MÁS POPULAR
          </span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="font-heading text-[16px] font-semibold text-[#FAFAFA]">{pkg.name}</span>
        {pkg.discount > 0 && (
          <span className="inline-flex items-center rounded-full bg-[#BEFF00]/10 px-2 py-0.5 text-[11px] font-semibold text-[#BEFF00]">
            -{pkg.discount}%
          </span>
        )}
      </div>
      <span className="mt-3 font-heading text-[36px] font-bold leading-none text-[#FAFAFA]">
        {pkg.credits}
      </span>
      <span className="mt-1 text-[12px] text-[#71717A]">créditos</span>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="font-heading text-[24px] font-bold text-[#FAFAFA]">
          S/ {pkg.priceInSoles.toFixed(2)}
        </span>
        <span className="text-[12px] text-[#52525B]">(S/ {pkg.pricePerCredit.toFixed(2)}/cr)</span>
      </div>
      <div className="mt-4 flex flex-col gap-2">
        {pkg.includes.map((item) => (
          <div key={item} className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-[#BEFF00]" />
            <span className="text-[13px] text-[#A1A1AA]">{item}</span>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onBuy}
        disabled={loading}
        className="mt-5 inline-flex items-center justify-center gap-2 rounded-[10px] h-[42px] w-full text-[14px] font-semibold transition-all disabled:opacity-50"
        style={{
          backgroundColor: pkg.popular ? "#BEFF00" : "transparent",
          color: pkg.popular ? "#09090B" : "#FAFAFA",
          border: pkg.popular ? "none" : "1px solid #27272A",
        }}
      >
        <Zap className="h-4 w-4" />
        Comprar
      </button>
    </div>
  );
}
