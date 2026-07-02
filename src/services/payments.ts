import { PaymentMethod } from '../types';

// Mocked payment layer. Swap for Midtrans/Xendit/Doku without touching UI.
let METHODS: PaymentMethod[] = [];

type CardInput = { number: string; expiry: string; cvc: string };

export const paymentsService = {
  async getMethods(): Promise<PaymentMethod[]> {
    await delay(200);
    return [...METHODS];
  },

  async linkCard(input: CardInput): Promise<PaymentMethod> {
    await delay(800);
    const last4 = input.number.replace(/\s/g, '').slice(-4);
    const method: PaymentMethod = {
      id: `card_${Date.now()}`,
      type: 'card',
      label: `Card •••• ${last4}`,
      last4,
      isDefault: METHODS.length === 0,
    };
    METHODS = [...METHODS, method];
    return method;
  },

  async linkBank(bankName: string, accountNumber: string): Promise<PaymentMethod> {
    await delay(800);
    const last4 = accountNumber.slice(-4);
    const method: PaymentMethod = {
      id: `bank_${Date.now()}`,
      type: 'bank',
      label: `${bankName} •••• ${last4}`,
      last4,
      isDefault: METHODS.length === 0,
    };
    METHODS = [...METHODS, method];
    return method;
  },

  async lookupBill(billNumber: string, merchantId: string): Promise<{ amount: number; tableLabel: string }> {
    await delay(900);
    // Deterministic mock: hash the bill number into a plausible IDR amount
    const seed = billNumber.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const amount = (50 + (seed % 200)) * 1000; // Rp 50.000 – Rp 249.000
    return { amount, tableLabel: `Bill #${billNumber.toUpperCase()}` };
  },

  async pay(amount: number, merchantId: string, methodId: string): Promise<{ transactionId: string; pointsEarned: number }> {
    await delay(1200);
    return {
      transactionId: `txn_${Date.now()}`,
      pointsEarned: Math.floor(amount / 1000) * 5,
    };
  },
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
