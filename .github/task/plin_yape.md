# Integración de Yape y Plin — Fashia × Culqi

> Culqi soporta **dos mecanismos distintos** para billeteras. Es importante entenderlos.

---

## Resumen Rápido

| Billetera | Método | Cómo paga el cliente | Flujo técnico | Límite |
|-----------|--------|---------------------|---------------|--------|
| **Yape** (directo) | Número + código OTP | Ingresa su celular y código de aprobación | Token (`ype_`) → Cargo | Máx S/ 2,000 |
| **Yape + Plin** (QR) | Escanea código QR | Abre su app y escanea QR | Orden → QR → Webhook | Mín S/ 6, Máx S/ 500 |

**En resumen:** Yape tiene integración directa (más fluida). Plin solo funciona vía código QR junto con Yape y otras billeteras.

---

## OPCIÓN 1: Yape Directo (Recomendado)

### Cómo funciona

```
1. Cliente elige "Pagar con Yape"
2. Se abre Culqi Checkout → pestaña Yape
3. Cliente ingresa su número de celular
4. Abre app Yape → menú → "Código de aprobación"
5. Ingresa el código (6 dígitos, vigencia 2 min) en el Checkout
6. Culqi genera token (ype_test_XXXX)
7. Tu backend crea el cargo con ese token
8. Pago completado
```

### Implementación Frontend

**Opción A: Culqi Checkout (lo más fácil)**

Solo activa Yape en las opciones del Checkout:

```typescript
// hooks/use-culqi.ts — agregar yape: true en options
Culqi.options({
  lang: "auto",
  paymentMethods: {
    tarjeta: true,
    yape: true,          // ← Activar Yape
    // billetera: true,   // ← QR para Yape/Plin (ver Opción 2)
  },
});
```

Eso es todo en el frontend. El Checkout mostrará automáticamente una pestaña "Yape" donde el cliente ingresa su número y código.

**Opción B: API directa (control total)**

Si quieres hacer tu propia UI de Yape sin usar el Checkout:

```typescript
// Crear token Yape directamente
const response = await fetch("https://api.culqi.com/v2/tokens/yape", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${CULQI_PUBLIC_KEY}`, // Llave PÚBLICA
  },
  body: JSON.stringify({
    number_phone: "912345678",    // Número del cliente
    otp: "716688",                // Código de aprobación (6 dígitos)
    amount: "3500",               // Monto en CÉNTIMOS
    metadata: {
      user_id: "usr_abc123",
    },
  }),
});

const token = await response.json();
// token.id = "ype_test_XXXXXXXX"
```

### Implementación Backend

El backend no cambia. Tu ruta `/api/culqi/charge` ya maneja tokens de Yape porque el `source_id` acepta tanto `tkn_` (tarjeta) como `ype_` (Yape):

```typescript
// app/api/culqi/charge/route.ts — YA FUNCIONA, no hay que cambiar nada
// El token Yape llega como "ype_test_XXXX" en vez de "tkn_test_XXXX"
// pero el endpoint /v2/charges acepta ambos en source_id

const result = await createCharge({
  amount: 3500,                    // S/ 35.00 en céntimos
  currency_code: "PEN",            // Yape SOLO acepta PEN
  email: "cliente@email.com",
  source_id: "ype_test_XXXXXXXX",  // Token Yape
});
```

### Datos de prueba Yape

| Campo | Valor de prueba |
|-------|----------------|
| Número celular | `900 000 001` |
| Código OTP | Cualquier 6 dígitos (ej: `123456`) |

### Limitaciones Yape directo

- Solo soles (PEN), no acepta dólares
- Monto máximo: S/ 2,000
- Código OTP vence en 2 minutos
- No sirve para suscripciones (solo cargos únicos)

---

## OPCIÓN 2: Billeteras Móviles vía QR (Yape + Plin + otras)

### Cómo funciona

Este método genera un **código QR** que el cliente escanea desde **cualquier billetera** (Yape, Plin, BBVA Wallet, etc).

```
1. Tu backend crea una ORDEN DE PAGO en Culqi
2. Culqi genera un código QR
3. El cliente escanea el QR con su app (Yape, Plin, etc.)
4. El cliente confirma el pago en su app
5. Culqi te notifica vía WEBHOOK que la orden fue pagada
6. Tu backend acredita los créditos
```

### Diferencia clave con Yape directo

| | Yape Directo | QR Billeteras |
|---|---|---|
| Flujo | Token → Cargo (instantáneo) | Orden → QR → Webhook (asíncrono) |
| Billeteras | Solo Yape | Yape, Plin, BBVA, etc. |
| Límite | Hasta S/ 2,000 | S/ 6 — S/ 500 |
| Suscripciones | No | No |
| Experiencia | Más fluida (sin salir de la web) | Cliente debe abrir su app |

### Implementación: Crear Orden de Pago

```typescript
// lib/culqi.ts — agregar función para crear órdenes

export async function createOrder(params: {
  amount: number;           // en céntimos
  currency_code: "PEN";
  description: string;
  order_number: string;     // ID único de tu sistema
  client_details: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  };
  expiration_date: number;  // Unix timestamp (cuándo expira el QR)
  metadata?: Record<string, string>;
}) {
  return culqiRequest<{
    id: string;              // ord_test_XXXX
    amount: number;
    status: string;          // "pendiente"
    qr: string;              // URL del código QR
    // ... más campos
  }>("/orders", {
    method: "POST",
    body: params as unknown as Record<string, unknown>,
  });
}
```

### API Route para Órdenes

```typescript
// app/api/culqi/order/route.ts

import { NextRequest, NextResponse } from "next/server";
import { createOrder, solesToCentimos } from "@/lib/culqi";

export async function POST(request: NextRequest) {
  const body = await request.json();

  // Expiración: 30 minutos desde ahora
  const expiration = Math.floor(Date.now() / 1000) + 30 * 60;

  const result = await createOrder({
    amount: solesToCentimos(body.amount),
    currency_code: "PEN",
    description: body.description ?? "Compra de créditos Fashia",
    order_number: `ORD-${Date.now()}`,
    client_details: {
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      phone_number: body.phone ?? "",
    },
    expiration_date: expiration,
    metadata: {
      user_id: body.user_id ?? "",
      credits: String(body.credits ?? 0),
    },
  });

  if (!result.success) {
    return NextResponse.json(
      { success: false, message: result.error.user_message },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    order_id: result.data.id,
    qr: result.data.qr,          // Mostrar este QR al usuario
    status: result.data.status,
  });
}
```

### Mostrar QR en el Frontend

```tsx
// components/QRPayment.tsx (ejemplo simplificado)
"use client";

import { useState } from "react";

export function QRPayment({ amount, credits }: { amount: number; credits: number }) {
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [waiting, setWaiting] = useState(false);

  const generateQR = async () => {
    setWaiting(true);
    const res = await fetch("/api/culqi/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        credits,
        description: `Compra de ${credits} créditos`,
        first_name: "Usuario",
        last_name: "Fashia",
        email: "usuario@email.com",
      }),
    });
    const data = await res.json();
    if (data.success) {
      setQrUrl(data.qr);
    }
  };

  return (
    <div>
      {!qrUrl ? (
        <button onClick={generateQR} disabled={waiting}>
          {waiting ? "Generando QR..." : "Pagar con Yape/Plin (QR)"}
        </button>
      ) : (
        <div>
          <p>Escanea este QR con Yape, Plin u otra billetera:</p>
          <img src={qrUrl} alt="QR de pago" width={250} height={250} />
          <p>Esperando confirmación de pago...</p>
          {/* Hacer polling o escuchar webhook para confirmar */}
        </div>
      )}
    </div>
  );
}
```

### Webhook para Órdenes (QR)

Agregar este caso en tu webhook existente:

```typescript
// app/api/culqi/webhook/route.ts — agregar este case

case "order.status.changed": {
  const order = payload.data;
  const orderId = order.id as string;
  const status = order.status as string;      // "paid" cuando se pagó
  const metadata = order.metadata as Record<string, string> | null;

  if (status === "paid") {
    console.log(`[Webhook] ✅ Orden pagada (QR): ${orderId}`);

    // Acreditar créditos
    // const userId = metadata?.user_id;
    // const credits = parseInt(metadata?.credits ?? "0");
    // await db.user.update({
    //   where: { id: userId },
    //   data: { credits: { increment: credits } }
    // });
  } else if (status === "expired") {
    console.log(`[Webhook] ⏰ Orden expirada: ${orderId}`);
  }

  break;
}
```

### Activar QR en Culqi Checkout

Si prefieres usar el Checkout en vez de generar el QR tú mismo:

```typescript
Culqi.options({
  paymentMethods: {
    tarjeta: true,
    yape: true,
    billetera: true,   // ← Activa el QR para Yape/Plin/etc.
  },
});
```

Pero para esto necesitas pasar una **orden** al Checkout en vez de un monto:

```typescript
// Primero crear la orden en tu backend
const orderRes = await fetch("/api/culqi/order", { ... });
const { order_id } = await orderRes.json();

// Luego pasar la orden al Checkout
Culqi.settings({
  title: "Comprar Créditos",
  currency: "PEN",
  amount: 3500,
  order: order_id,   // ← Necesario para billeteras QR
});
```

---

## ¿Qué recomiendo para Fashia?

**Implementar en este orden:**

### Fase 1 (inmediato)
- [x] Tarjetas de crédito/débito (ya implementado)
- [ ] Activar Yape directo en el Checkout (`yape: true`)
- Esto cubre la gran mayoría de tus pagos

### Fase 2 (después)
- [ ] Agregar billeteras QR (Plin y otros) si hay demanda
- Requiere implementar el flujo de órdenes (más complejo, asíncrono)

### ¿Por qué?

Yape directo es **instantáneo** (el usuario no sale de tu web) y cubre al 90%+ de usuarios de billeteras en Perú. El flujo QR para Plin es más complejo porque es asíncrono (necesitas webhook + polling) y tiene un límite menor (S/ 500 vs S/ 2,000).

---

## Resumen de Cambios para Activar Yape

Literalmente **una línea** en tu hook:

```diff
// hooks/use-culqi.ts
  Culqi.options({
    paymentMethods: {
      tarjeta: true,
+     yape: true,
    },
  });
```

El backend ya está listo — no necesita cambios porque `source_id` acepta tokens de Yape (`ype_test_`) automáticamente.

---

## Referencias

| Recurso | URL |
|---------|-----|
| Yape (docs) | https://docs.culqi.com/es/documentacion/pagos-online/cargo-unico/tokens-yape |
| Billeteras QR (docs) | https://docs.culqi.com/es/documentacion/pagos-online/ordenes-de-pago/billetera-moviles |
| API Tokens Yape | https://apidocs.culqi.com/#tag/Tokens/operation/crear-token-yape |
| API Órdenes | https://apidocs.culqi.com/#tag/Ordenes |
| Checkout config | https://docs.culqi.com/es/documentacion/checkout |