// lib/payment-utils.ts
export type PaymentMethod = 
  | 'dinheiro' 
  | 'pix' 
  | 'cash'
  | 'debit'
  | 'credit'
  | 'cartao_debito' 
  | 'cartao_credito';

export type PaymentStatus = 'paid' | 'pending' | 'received' | 'cancelled';

export function getAutomaticPaymentStatus(
  paymentMethod: PaymentMethod | string,
  installments: number = 1
): PaymentStatus {
  // PIX, Dinheiro, Débito → SEMPRE PAGO
  if (['pix', 'dinheiro', 'cash', 'debit', 'cartao_debito'].includes(paymentMethod)) {
    return 'received';
  }
  
  // Crédito à vista (1x) → PAGO
  if (['credit', 'cartao_credito'].includes(paymentMethod) && installments === 1) {
    return 'received';
  }
  
  // Crédito parcelado → PENDENTE
  if (['credit', 'cartao_credito'].includes(paymentMethod) && installments > 1) {
    return 'pending';
  }
  
  return 'received';
}

export const paymentMethodLabels: Record<string, string> = {
  dinheiro: 'Dinheiro',
  cash: 'Dinheiro',
  pix: 'PIX',
  debit: 'Débito',
  credit: 'Crédito',
  cartao_debito: 'Cartão de Débito',
  cartao_credito: 'Cartão de Crédito',
};

export const paymentStatusConfig: Record<PaymentStatus, {
  label: string;
  color: string;
}> = {
  paid: {
    label: 'Pago',
    color: 'bg-green-100 text-green-800',
  },
  received: {
    label: 'Recebido',
    color: 'bg-green-100 text-green-800',
  },
  pending: {
    label: 'Pendente',
    color: 'bg-yellow-100 text-yellow-800',
  },
  cancelled: {
    label: 'Cancelado',
    color: 'bg-red-100 text-red-800',
  },
};

export function isImmediatePayment(paymentMethod: string): boolean {
  return ['pix', 'dinheiro', 'cash', 'debit', 'cartao_debito'].includes(paymentMethod);
}
