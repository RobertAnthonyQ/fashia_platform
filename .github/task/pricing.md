# 🚀 Guía de Desarrollo — Integración Culqi para Fashia

> **Plataforma:** Fashia
> **Pasarela de pagos:** Culqi (Entorno de integración / test)
> **Stack:** Next.js 14+ (App Router) + TypeScript
> **Fecha:** Marzo 2026

---

## 📋 Estado de Configuración

### Credenciales (✅ YA CONFIGURADAS)

```env
# .env.local — YA LISTO
CULQI_PUBLIC_KEY=pk_test_mfz2E2fYfPiRpQ67
CULQI_SECRET_KEY=sk_test_gamDy4C0LspqwXsu
CULQI_RSA_ID=7e075569-2a31-4eca-bef9-2253eb87253b
CULQI_RSA_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCb8H9VZcvDOhGpbTkqByGiWnCt\n5WNS6U5w+A5TnXM+WKA7HnhUx8flc/Givvl8sRKznuvnaQ7WifSZ4dJolx6CLMbD\nXYTTUjksskpPwygXqqs4xa2aZkE3RmyDHqfAylWLUNiaTJDg4Bzidus9UtmmS4kG\nUtTU3Ax0hLt31OQI6wIDAQAB\n-----END PUBLIC KEY-----

NEXT_PUBLIC_CULQI_PUBLIC_KEY=pk_test_mfz2E2fYfPiRpQ67
NEXT_PUBLIC_CULQI_RSA_ID=7e075569-2a31-4eca-bef9-2253eb87253b
NEXT_PUBLIC_CULQI_RSA_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----\nMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCb8H9VZcvDOhGpbTkqByGiWnCt\n5WNS6U5w+A5TnXM+WKA7HnhUx8flc/Givvl8sRKznuvnaQ7WifSZ4dJolx6CLMbD\nXYTTUjksskpPwygXqqs4xa2aZkE3RmyDHqfAylWLUNiaTJDg4Bzidus9UtmmS4kG\nUtTU3Ax0hLt31OQI6wIDAQAB\n-----END PUBLIC KEY-----
```

| Llave | Valor | Dónde se usa |
|-------|-------|-------------|
| `CULQI_PUBLIC_KEY` | `pk_test_mfz2E2f...` | Frontend — identifica el comercio |
| `CULQI_SECRET_KEY` | `sk_test_gamDy4C...` | Backend ÚNICAMENTE — ejecuta cobros |
| `CULQI_RSA_ID` | `7e075569-2a31-...` | Frontend — encripta datos de tarjeta |
| `CULQI_RSA_PUBLIC_KEY` | `-----BEGIN PUBLIC KEY-----...` | Frontend — encripta datos de tarjeta |

### Paneles de Culqi

| Entorno | URL | Para qué |
|---------|-----|----------|
| Test | https://integ-panel.culqi.com | Desarrollo y pruebas |
| Producción | https://mipanel.culqi.com | Cuando salgamos a producción |

---

## 💰 Modelo de Negocio — Créditos Fashia

### Paquetes de Créditos (Compra Única)

| Paquete | Créditos | Precio (PEN) | Precio/Crédito | Descuento | Incluye |
|---------|----------|-------------|----------------|-----------|---------|
| **Sueltos** | Mínimo 10 | S/ 0.50 × cant. | S/ 0.50 | 0% | Solo créditos |
| **Starter** | 100 | S/ 35.00 | S/ 0.35 | 30% | 20 fotos Flash ó 1 video 8s + 8 fotos |
| **Popular** ⭐ | 300 | S/ 84.00 | S/ 0.28 | 44% | 60 fotos Flash ó 5 videos 8s |
| **Pro** | 700 | S/ 168.00 | S/ 0.24 | 52% | 140 fotos Flash ó 11 videos 8s |

### Configuración Backend de Paquetes

```typescript
// lib/config/credit-packages.ts

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceInSoles: number;       // Precio para el usuario
  priceInCentimos: number;    // Precio para Culqi (soles × 100)
  pricePerCredit: number;     // Precio por crédito individual
  discount: number;           // Porcentaje de descuento
  popular: boolean;           // Destacar en UI
  includes: string[];         // Beneficios extra
  minQuantity?: number;       // Solo para créditos sueltos
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "sueltos",
    name: "Créditos sueltos",
    credits: 10,               // Mínimo
    priceInSoles: 5.00,        // 10 × S/ 0.50
    priceInCentimos: 500,
    pricePerCredit: 0.50,
    discount: 0,
    popular: false,
    includes: [],
    minQuantity: 10,
  },
  {
    id: "starter",
    name: "Starter",
    credits: 100,
    priceInSoles: 35.00,
    priceInCentimos: 3500,
    pricePerCredit: 0.35,
    discount: 30,
    popular: false,
    includes: [
      "100 créditos",
      "20 fotos Flash",
      "ó 1 video 8s + 8 fotos",
    ],
  },
  {
    id: "popular",
    name: "Popular",
    credits: 300,
    priceInSoles: 84.00,
    priceInCentimos: 8400,
    pricePerCredit: 0.28,
    discount: 44,
    popular: true,             // ⭐ Más popular
    includes: [
      "300 créditos",
      "60 fotos Flash",
      "ó 5 videos 8s",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    credits: 700,
    priceInSoles: 168.00,
    priceInCentimos: 16800,
    pricePerCredit: 0.24,
    discount: 52,
    popular: false,
    includes: [
      "700 créditos",
      "140 fotos Flash",
      "ó 11 videos 8s",
    ],
  },
];

// Helper: Para créditos sueltos calcula el precio dinámico
export function calcularPrecioSueltos(cantidad: number): {
  priceInSoles: number;
  priceInCentimos: number;
} {
  const MIN = 10;
  const PRECIO_UNITARIO = 0.50;
  const qty = Math.max(cantidad, MIN);
  const priceInSoles = parseFloat((qty * PRECIO_UNITARIO).toFixed(2));
  return {
    priceInSoles,
    priceInCentimos: Math.round(priceInSoles * 100),
  };
}
```

---

## 🏗️ Arquitectura de Archivos

```
fashia/
├── .env.local                              ← ✅ Llaves configuradas
│
├── lib/
│   ├── culqi.ts                            ← Cliente API Culqi (server-side)
│   └── config/
│       └── credit-packages.ts              ← Paquetes y precios
│
├── types/
│   └── culqi.ts                            ← Tipos TypeScript del API
│
├── hooks/
│   └── use-culqi.ts                        ← Hook para Culqi Checkout (client)
│
├── app/
│   ├── api/
│   │   └── culqi/
│   │       ├── charge/route.ts             ← POST: Cobrar créditos
│   │       ├── plan/route.ts               ← GET/POST: Gestión de planes
│   │       ├── subscription/route.ts       ← POST/DELETE: Suscripciones
│   │       └── webhook/route.ts            ← POST: Notificaciones de Culqi
│   │
│   └── pricing/
│       └── page.tsx                        ← Página de precios
│
├── components/
│   ├── CreditPricing.tsx                   ← UI de paquetes de créditos
│   ├── SubscriptionPlans.tsx               ← UI de planes de suscripción
│   └── BuyCreditsButton.tsx                ← Botón de compra
│
└── scripts/
    └── seed-plans.ts                       ← Script para crear planes en Culqi
```

---

## 📐 Flujos de Pago

### Flujo 1: Compra de Créditos (paquete fijo)

```
1. Usuario ve /pricing → elige paquete (Starter, Popular, Pro)
2. Click "Comprar" → se abre Culqi Checkout
3. Usuario ingresa tarjeta → Culqi genera TOKEN (5 min de vida)
4. Frontend envía token → POST /api/culqi/charge
5. Backend crea el cargo en Culqi con sk_test
6. Si exitoso → acreditar créditos en DB del usuario
7. Webhook confirma → backup de seguridad
```

### Flujo 2: Compra de Créditos Sueltos (cantidad variable)

```
1. Usuario ingresa cantidad (mínimo 10) en input numérico
2. Se calcula precio: cantidad × S/ 0.50
3. Click "Comprar" → Culqi Checkout con monto calculado
4. Mismo flujo que arriba (pasos 3-7)
```

### Flujo 3: Suscripción Mensual

```
1. Usuario elige plan (Básico, Pro, Premium)
2. Click "Suscribirse" → Culqi Checkout
3. Token generado → POST /api/culqi/subscription
4. Backend ejecuta flujo completo:
   a) Crear CLIENTE en Culqi
   b) Crear TARJETA (asociar token + cliente)
   c) Crear SUSCRIPCIÓN (asociar tarjeta + plan)
5. Culqi cobra automáticamente cada mes
6. Webhooks notifican: cobro exitoso/fallido/cancelación
```

---

## ✅ Checklist de Implementación

### Fase 1: Infraestructura Base

- [ ] Copiar `types/culqi.ts` al proyecto
- [ ] Copiar `lib/culqi.ts` al proyecto
- [ ] Copiar `lib/config/credit-packages.ts` al proyecto
- [ ] Copiar `hooks/use-culqi.ts` al proyecto
- [ ] Verificar que `.env.local` tiene las 4 llaves (API + RSA)
- [ ] Reiniciar el servidor de desarrollo después de agregar `.env.local`
- [ ] Verificar que `NEXT_PUBLIC_*` variables están accesibles en el frontend

### Fase 2: API Routes (Backend)

- [ ] Crear `app/api/culqi/charge/route.ts` — Cargos únicos
- [ ] Crear `app/api/culqi/plan/route.ts` — Gestión de planes
- [ ] Crear `app/api/culqi/subscription/route.ts` — Suscripciones
- [ ] Crear `app/api/culqi/webhook/route.ts` — Webhooks
- [ ] Agregar autenticación a las rutas (verificar sesión del usuario)
- [ ] Agregar validación de montos (que coincida con los paquetes definidos)
- [ ] Agregar rate limiting a las rutas API

### Fase 3: Frontend — Compra de Créditos

- [ ] Crear componente `CreditPricing.tsx` con los 4 paquetes
- [ ] Implementar selector de cantidad para créditos sueltos (mínimo 10)
- [ ] Integrar `useCulqi()` hook para abrir el Checkout
- [ ] Manejar estado: idle → processing → success → error
- [ ] Mostrar feedback visual al usuario (loading, éxito, error)
- [ ] Después de compra exitosa, actualizar saldo de créditos en la UI
- [ ] Probar con tarjeta exitosa: `4111 1111 1111 1111` (CVV: 123)
- [ ] Probar con tarjeta fallida: `4000 0400 0000 0008` (insufficient_funds)

### Fase 4: Frontend — Suscripciones

- [ ] Ejecutar `seed-plans.ts` para crear planes en Culqi
- [ ] Guardar los IDs de planes (`pln_test_...`) en config o DB
- [ ] Crear componente `SubscriptionPlans.tsx`
- [ ] Implementar flujo completo: token → customer → card → subscription
- [ ] Mostrar estado actual de suscripción del usuario
- [ ] Implementar botón de cancelar suscripción
- [ ] Probar crear y cancelar suscripción con tarjeta de prueba

### Fase 5: Webhooks

- [ ] Configurar URL de webhook en CulqiPanel (Eventos → Webhooks)
- [ ] Para desarrollo local: instalar y configurar `ngrok`
  ```bash
  ngrok http 3000
  # Copiar URL https://xxxx.ngrok.io/api/culqi/webhook al panel
  ```
- [ ] Implementar handler para `charge.creation.succeeded`
  - [ ] Acreditar créditos al usuario en la DB
  - [ ] Registrar transacción en tabla de historial
- [ ] Implementar handler para `charge.creation.failed`
  - [ ] Registrar el fallo
  - [ ] Notificar al usuario si es necesario
- [ ] Implementar handler para `subscription.charge.succeeded`
  - [ ] Renovar acceso/plan del usuario
- [ ] Implementar handler para `subscription.charge.failed`
  - [ ] Enviar email de aviso
  - [ ] Dar período de gracia (ej: 3 días)
- [ ] Implementar handler para `subscription.canceled`
  - [ ] Degradar plan del usuario a free
- [ ] Verificar que SIEMPRE responde 200 (evitar reintentos infinitos)

### Fase 6: Base de Datos

- [ ] Crear tabla/modelo `Transaction` (historial de compras)
  ```
  id, userId, type (credit_purchase | subscription),
  culqiChargeId, amount, credits, status, createdAt
  ```
- [ ] Crear tabla/modelo `Subscription` (suscripciones activas)
  ```
  id, userId, culqiSubscriptionId, culqiCustomerId,
  culqiCardId, planId, status, currentPeriodEnd, createdAt
  ```
- [ ] Agregar campo `credits` (integer) al modelo `User`
- [ ] Agregar campo `plan` (string: free/basic/pro/premium) al modelo `User`
- [ ] Implementar lógica de acreditación de créditos (incremento atómico)
- [ ] Implementar lógica de consumo de créditos (decremento con validación)

### Fase 7: Seguridad y Validación

- [ ] Verificar que `sk_test_*` NO está expuesta en el frontend (build check)
- [ ] Validar montos en backend (que coincidan con paquetes, evitar manipulación)
- [ ] Implementar idempotencia (evitar doble acreditación por retry)
- [ ] Enviar datos antifraude en cada cargo (`antifraud_details`)
- [ ] Agregar logging de errores (Sentry o similar)
- [ ] Verificar que HTTPS está activo en producción

### Fase 8: Testing Completo

- [ ] Test E2E: Compra de paquete Starter (100 créditos)
- [ ] Test E2E: Compra de paquete Popular (300 créditos)
- [ ] Test E2E: Compra de paquete Pro (700 créditos)
- [ ] Test E2E: Compra de créditos sueltos (cantidad variable)
- [ ] Test E2E: Suscripción a plan mensual
- [ ] Test E2E: Cancelación de suscripción
- [ ] Test: Tarjeta rechazada muestra mensaje correcto
- [ ] Test: Fondos insuficientes muestra mensaje correcto
- [ ] Test: Webhook acredita créditos correctamente
- [ ] Test: Webhook de suscripción renueva acceso
- [ ] Test: No se pueden comprar créditos sin sesión activa
- [ ] Test: No se puede manipular el monto desde el frontend

### Fase 9: Go-Live (Producción)

- [ ] Completar proceso de certificación con Culqi
- [ ] Crear llaves RSA en panel de PRODUCCIÓN
- [ ] Reemplazar TODAS las llaves test → live en `.env.local`
  ```
  pk_test_... → pk_live_...
  sk_test_... → sk_live_...
  RSA test → RSA live
  ```
- [ ] Configurar webhooks en panel de PRODUCCIÓN
- [ ] Hacer una compra real con monto mínimo para verificar
- [ ] Monitorear primeras 10 transacciones en CulqiPanel
- [ ] Verificar que los abonos llegan a la cuenta bancaria

---

## 🧪 Tarjetas de Prueba

### Compras exitosas

| Marca | Número | CVV | Venc. |
|-------|--------|-----|-------|
| Visa | `4111 1111 1111 1111` | 123 | 12/30 |
| Mastercard | `5111 1111 1111 1118` | 039 | 12/30 |
| Amex | `3712 1212 1212 122` | 2841 | 12/30 |

### Errores específicos

| Número | CVV | Error que simula |
|--------|-----|------------------|
| `4000 0200 0000 0000` | 354 | Tarjeta robada |
| `4000 0400 0000 0008` | 295 | Fondos insuficientes |
| `5400 0200 0000 0003` | 203 | CVV incorrecto |

### 3DS (autenticación extra)

| Número | CVV | Resultado |
|--------|-----|-----------|
| `4456 5300 0000 1096` | 111 | Auth exitosa con Challenge |
| `4456 5300 0000 1005` | 111 | Auth exitosa sin Challenge |

**Email para pruebas:** `review@culqi.com`
**Yape test:** Celular `900 000 001`, OTP: cualquier 6 dígitos

---

## ⚠️ Reglas Importantes

1. **Montos siempre en CÉNTIMOS** al enviar a Culqi: S/ 35.00 → `3500`
2. **Token vive 5 minutos** y se usa UNA sola vez
3. **Nunca guardar** datos de tarjeta en tu servidor
4. **Webhook siempre responde 200**, incluso si hay error interno
5. **Validar montos en backend**, no confiar en lo que envía el frontend
6. **Datos antifraude** siempre incluirlos, mejoran la tasa de aprobación
7. **La llave privada (sk_test)** NUNCA debe aparecer en código frontend

---

## 📚 Links de Referencia

| Recurso | URL |
|---------|-----|
| Documentación Culqi | https://docs.culqi.com/es/documentacion |
| API Reference | https://apidocs.culqi.com/ |
| Panel Test | https://integ-panel.culqi.com |
| Panel Producción | https://mipanel.culqi.com |
| GitHub SDKs | https://github.com/culqi |
| Comunidad | https://facebook.com/groups/2816114995065348 |
| Soporte | (01) 643 1050 / 970141600 |