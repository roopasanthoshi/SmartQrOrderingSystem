export interface GstResult {
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  gstPercentage: number;
  enableGst: boolean;
}

export function calculateGst(subtotal: number, enableGst: boolean, gstPercentage: number): GstResult {
  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  if (!enableGst || gstPercentage <= 0) {
    return {
      subtotal: roundedSubtotal,
      taxAmount: 0.00,
      totalAmount: roundedSubtotal,
      gstPercentage: 0,
      enableGst: false,
    };
  }
  const taxAmount = Math.round(roundedSubtotal * (gstPercentage / 100) * 100) / 100;
  const totalAmount = Math.round((roundedSubtotal + taxAmount) * 100) / 100;
  return {
    subtotal: roundedSubtotal,
    taxAmount,
    totalAmount,
    gstPercentage,
    enableGst,
  };
}
