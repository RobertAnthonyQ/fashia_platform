export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  priceInSoles: number;
  priceInCentimos: number;
  pricePerCredit: number;
  discount: number;
  popular: boolean;
  includes: string[];
  minQuantity?: number;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: "sueltos",
    name: "Créditos sueltos",
    credits: 10,
    priceInSoles: 5.0,
    priceInCentimos: 500,
    pricePerCredit: 0.5,
    discount: 0,
    popular: false,
    includes: [],
    minQuantity: 10,
  },
  {
    id: "starter",
    name: "Starter",
    credits: 100,
    priceInSoles: 35.0,
    priceInCentimos: 3500,
    pricePerCredit: 0.35,
    discount: 30,
    popular: false,
    includes: ["100 créditos", "20 fotos Flash", "ó 1 video 8s + 8 fotos"],
  },
  {
    id: "popular",
    name: "Popular",
    credits: 300,
    priceInSoles: 84.0,
    priceInCentimos: 8400,
    pricePerCredit: 0.28,
    discount: 44,
    popular: true,
    includes: ["300 créditos", "60 fotos Flash", "ó 5 videos 8s"],
  },
  {
    id: "pro",
    name: "Pro",
    credits: 700,
    priceInSoles: 168.0,
    priceInCentimos: 16800,
    pricePerCredit: 0.24,
    discount: 52,
    popular: false,
    includes: ["700 créditos", "140 fotos Flash", "ó 11 videos 8s"],
  },
];

export function calcularPrecioSueltos(cantidad: number): {
  priceInSoles: number;
  priceInCentimos: number;
} {
  const MIN = 10;
  const PRECIO_UNITARIO = 0.5;
  const qty = Math.max(cantidad, MIN);
  const priceInSoles = parseFloat((qty * PRECIO_UNITARIO).toFixed(2));
  return {
    priceInSoles,
    priceInCentimos: Math.round(priceInSoles * 100),
  };
}

export function getPackageById(id: string): CreditPackage | undefined {
  return CREDIT_PACKAGES.find((pkg) => pkg.id === id);
}
