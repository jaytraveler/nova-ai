// Payment provider types
export type PaymentProvider = "midtrans" | "xendit" | "paypal";

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  priceIdr: number; // Price in IDR for local payments
  currency: string;
  interval: "month" | "year" | "lifetime";
  features: string[];
  popular?: boolean;
}

export const PAYMENT_PLANS: PaymentPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceIdr: 0,
    currency: "USD",
    interval: "month",
    features: [
      "10 messages/day",
      "5 voice min/day",
      "All 7 AIs",
      "Personal & Group chat",
    ],
    popular: false,
  },
  {
    id: "pro",
    name: "Pro",
    price: 19,
    priceIdr: 299000,
    currency: "USD",
    interval: "month",
    features: [
      "Unlimited messages",
      "100 voice min/mo",
      "All 7 AIs",
      "Chat history saved",
      "Priority support",
    ],
    popular: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 99,
    priceIdr: 1499000,
    currency: "USD",
    interval: "month",
    features: [
      "Everything in Pro",
      "Unlimited voice",
      "Custom AI training",
      "API access",
      "Dedicated support",
      "SLA guarantee",
    ],
    popular: false,
  },
];

export const PAYMENT_METHODS = {
  // Indonesian Local Payments
  midtrans: {
    name: "Midtrans",
    displayName: "Midtrans",
    description: "GoPay, OVO, DANA, QRIS, Bank Transfer",
    icon: "🇮🇩",
    supportedMethods: ["gopay", "ovo", "dana", "shopeepay", "qris", "bca", "mandiri", "bni", "bri"],
    currencies: ["IDR"],
    isLocal: true,
  },
  xendit: {
    name: "Xendit",
    displayName: "Xendit",
    description: "E-wallets, Bank Transfer, Virtual Account",
    icon: "💳",
    supportedMethods: ["ovo", "dana", "linkaja", "shopeepay", "va", "retail"],
    currencies: ["IDR"],
    isLocal: true,
  },
  // International Payments
  paypal: {
    name: "PayPal",
    displayName: "PayPal",
    description: "Pay with PayPal or Credit Card",
    icon: "🅿️",
    supportedMethods: ["paypal", "card"],
    currencies: ["USD", "EUR", "GBP"],
    isLocal: false,
  },
};
