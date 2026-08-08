export interface KotPrintData {
  kotNumber: string;
  tableNumber: number;
  customerName: string;
  customerMobile: string;
  createdAt: Date | string;
  printer1Items: { name: string; quantity: number; notes?: string | null }[];
  printer2Items: { name: string; quantity: number; notes?: string | null }[];
}

export function formatThermalKot(printData: KotPrintData, printerType: 'PRINTER_1' | 'PRINTER_2') {
  const isFoodPrinter = printerType === 'PRINTER_1';
  const targetItems = isFoodPrinter ? printData.printer1Items : printData.printer2Items;
  const printerTitle = isFoodPrinter ? 'KITCHEN FOOD KOT' : 'BEVERAGE BAR KOT';

  if (targetItems.length === 0) {
    return null; // Nothing to print on this specific printer
  }

  const dateStr = new Date(printData.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  let text = '';
  text += '================================\n';
  text += '         KANCHI CAFE            \n';
  text += `      ${printerTitle}           \n`;
  text += '================================\n';
  text += `KOT NO   : ${printData.kotNumber}\n`;
  text += `TABLE NO : Table ${printData.tableNumber}\n`;
  text += `CUSTOMER : ${printData.customerName} (${printData.customerMobile.slice(-4)})\n`;
  text += `TIME     : ${dateStr}\n`;
  text += '--------------------------------\n';
  text += 'QTY   ITEM NAME           NOTES \n';
  text += '--------------------------------\n';

  targetItems.forEach((item) => {
    const qtyStr = `${item.quantity}`.padEnd(6);
    const nameStr = item.name.slice(0, 18).padEnd(18);
    text += `${qtyStr}${nameStr}\n`;
    if (item.notes) {
      text += `      * Note: ${item.notes}\n`;
    }
  });

  text += '--------------------------------\n';
  text += '      *** END OF KOT ***        \n';
  text += '================================\n\n';

  return text;
}

export function formatThermalReceipt(order: any, cafeSettings: any) {
  const cafeName = cafeSettings?.name || 'KANCHI CAFE';
  const cafeAddress = cafeSettings?.address || 'Alkapuri Chourasta, Nagole';
  const cafePhone = cafeSettings?.phone || '9000407970';
  const cafeGst = cafeSettings?.gst || '36AFNFS9271D1ZJ';

  const dateStr = new Date(order.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });

  let text = '';
  text += '================================\n';
  text += `         ${cafeName.toUpperCase()}        \n`;
  text += `   ${cafeAddress} \n`;
  text += `   Ph: ${cafePhone} | GST: ${cafeGst}\n`;
  text += '================================\n';
  text += `RECEIPT / BILL                  \n`;
  text += `KOT NO   : ${order.kotNumber}\n`;
  text += `TABLE NO : Table ${order.table?.tableNumber || order.tableId}\n`;
  text += `CUSTOMER : ${order.customer?.name} (${order.customer?.mobile})\n`;
  text += `DATE     : ${dateStr}\n`;
  text += '--------------------------------\n';
  text += 'ITEM               QTY   PRICE  \n';
  text += '--------------------------------\n';

  order.items.forEach((item: any) => {
    const nameStr = item.menuItemName.slice(0, 17).padEnd(17);
    const qtyStr = `${item.quantity}`.padEnd(5);
    const priceStr = `Rs.${(item.unitPrice * item.quantity).toFixed(2)}`.padStart(8);
    text += `${nameStr}${qtyStr}${priceStr}\n`;
  });

  text += '--------------------------------\n';
  text += `SUBTOTAL :          Rs.${order.subtotal.toFixed(2)}\n`;
  text += `TAX (GST):          Rs.${order.taxAmount.toFixed(2)}\n`;
  text += `GRAND TOTAL:        Rs.${order.totalAmount.toFixed(2)}\n`;
  text += '--------------------------------\n';
  text += `PAYMENT  : ${order.paymentMethod} (${order.paymentStatus})\n`;
  text += '================================\n';
  text += '    Thank You! Visit Again!     \n';
  text += '================================\n\n';

  return text;
}
