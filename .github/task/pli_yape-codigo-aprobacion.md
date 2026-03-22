# Pagos con Yape — Código de Aprobación

## ¿Qué es el código de aprobación?

Es un número de **6 dígitos** que el cliente genera desde su app Yape. Funciona como un PIN temporal para autorizar un pago sin necesidad de escanear QR.

Tiene una vigencia de **2 minutos**. Pasado ese tiempo, el cliente debe generar uno nuevo.

---

## Cómo obtiene el cliente su código

1. Abre la app **Yape** en su celular
2. Toca el **menú lateral** (las 3 líneas o ícono de hamburguesa)
3. Selecciona **"Código de aprobación"**
4. Yape muestra un código de 6 dígitos (ej: `716688`)
5. El cliente copia o memoriza ese código
6. Lo ingresa en tu página web junto con su número de celular

---

## Flujo completo del pago

```
CLIENTE                          TU WEB                           CULQI
  │                                │                                │
  │  1. Elige "Pagar con Yape"     │                                │
  │ ──────────────────────────────>│                                │
  │                                │                                │
  │  2. Abre app Yape en su cel    │                                │
  │     Menú → Código aprobación   │                                │
  │     Obtiene: 716688            │                                │
  │                                │                                │
  │  3. Ingresa:                   │                                │
  │     Celular: 912345678         │                                │
  │     Código:  716688            │                                │
  │ ──────────────────────────────>│                                │
  │                                │  4. POST /v2/tokens/yape       │
  │                                │ ──────────────────────────────>│
  │                                │                                │
  │                                │  5. Token: ype_test_XXXX       │
  │                                │ <──────────────────────────────│
  │                                │                                │
  │                                │  6. POST /v2/charges           │
  │                                │     source_id: ype_test_XXXX   │
  │                                │ ──────────────────────────────>│
  │                                │                                │
  │                                │  7. Cargo exitoso              │
  │                                │ <──────────────────────────────│
  │                                │                                │
  │  8. "Pago completado"          │                                │
  │ <──────────────────────────────│                                │
```

---

## Crear token Yape (Frontend)

Se llama desde el frontend usando la **llave pública** (`pk_test_`).

```
POST https://api.culqi.com/v2/tokens/yape
Authorization: Bearer pk_test_mfz2E2fYfPiRpQ67
Content-Type: application/json

{
  "number_phone": "912345678",
  "otp": "716688",
  "amount": "3500",
  "metadata": {
    "user_id": "usr_abc123"
  }
}
```

**Campos:**

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `number_phone` | string | Número de celular del cliente (9 dígitos) |
| `otp` | string | Código de aprobación de 6 dígitos |
| `amount` | string | Monto en **céntimos** (S/ 35.00 = `"3500"`) |
| `metadata` | object | Datos opcionales para tu uso interno |

**Respuesta exitosa:**

```json
{
  "object": "token",
  "id": "ype_test_1AbXq1pLyYyaW1z9",
  "type": "card",
  "email": "...",
  "creation_date": 1487021247000
}
```

El token Yape tiene prefijo `ype_` en vez de `tkn_` (tarjeta). Vive 5 minutos y se usa una sola vez, igual que un token de tarjeta.

---

## Crear cargo con token Yape (Backend)

Se llama desde el backend usando la **llave privada** (`sk_test_`).

```
POST https://api.culqi.com/v2/charges
Authorization: Bearer sk_test_gamDy4C0LspqwXsu
Content-Type: application/json

{
  "amount": 3500,
  "currency_code": "PEN",
  "email": "cliente@email.com",
  "source_id": "ype_test_1AbXq1pLyYyaW1z9"
}
```

Es **exactamente igual** que un cargo con tarjeta. La única diferencia es que el `source_id` empieza con `ype_` en vez de `tkn_`. Tu endpoint `/api/culqi/charge` existente ya lo soporta sin cambios.

---

## Limitaciones

| Regla | Valor |
|-------|-------|
| Moneda | Solo **PEN** (soles) |
| Monto máximo | S/ 2,000 |
| Vigencia del código OTP | 2 minutos |
| Usos del código | 1 solo uso |
| Vigencia del token generado | 5 minutos |
| Suscripciones | No soportado (solo cargos únicos) |

---

## Datos de prueba (entorno test)

En modo test **no se necesita la app Yape real**. Culqi acepta valores ficticios:

| Campo | Valor de prueba |
|-------|----------------|
| Número de celular | `900 000 001` |
| Código de aprobación | Cualquier 6 dígitos (ej: `123456`) |

---

## Implementación en Fashia

### Forma rápida: Activar en Culqi Checkout

Agregar `yape: true` en las opciones del Checkout. El formulario de celular + código ya viene integrado en el pop-up de Culqi:

```typescript
Culqi.options({
  paymentMethods: {
    tarjeta: true,
    yape: true,
  },
});
```

No necesitas crear ningún formulario propio. El Checkout muestra una pestaña "Yape" automáticamente.

### Forma personalizada: Formulario propio

Si quieres tu propia UI, necesitas dos campos y un botón:

```
┌─────────────────────────────────┐
│  Pagar con Yape                 │
│                                 │
│  Número de celular              │
│  ┌───────────────────────────┐  │
│  │ 912345678                 │  │
│  └───────────────────────────┘  │
│                                 │
│  Código de aprobación           │
│  ┌───────────────────────────┐  │
│  │ 716688                    │  │
│  └───────────────────────────┘  │
│  Abre Yape → Menú → Código     │
│  de aprobación (vence en 2 min) │
│                                 │
│  ┌───────────────────────────┐  │
│  │        Pagar S/ 35.00     │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

Con esos dos valores llamas a `POST /v2/tokens/yape` desde el frontend y luego envías el token a tu backend para crear el cargo.

---

## Referencias

| Recurso | URL |
|---------|-----|
| Documentación Yape | https://docs.culqi.com/es/documentacion/pagos-online/cargo-unico/tokens-yape |
| API Crear Token Yape | https://apidocs.culqi.com/#tag/Tokens/operation/crear-token-yape |
| API Crear Cargo | https://apidocs.culqi.com/#tag/Cargos/operation/crear-cargo |