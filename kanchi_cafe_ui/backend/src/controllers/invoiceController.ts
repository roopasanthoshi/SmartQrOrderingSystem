import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { verifyToken } from '../utils/jwt';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export async function downloadOrderInvoice(req: Request, res: Response) {
  try {
    const orderId = String(req.params.id);
    const mobile = String(req.query.mobile || '').trim();

    // Check if the requester is Admin
    const authHeader = req.headers.authorization;
    let isAdmin = false;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const adminPayload = verifyToken(token);
      if (adminPayload) {
        isAdmin = true;
      }
    }

    // Retrieve order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: true,
        table: true,
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Security Check: customer can only download their own invoice
    if (!isAdmin) {
      if (!mobile || order.customer.mobile !== mobile) {
        return res.status(403).json({ success: false, message: 'Forbidden: You do not have permission to access this invoice' });
      }
    }

    // Retrieve Cafe Settings & Admin User for email
    const [cafeSettings, adminUser] = await Promise.all([
      prisma.cafeSettings.findFirst(),
      prisma.adminUser.findFirst(),
    ]);

    // Cafe branding details
    const cafeName = cafeSettings?.name || 'KANCHI CAFE';
    const address = cafeSettings?.address || 'Alkapuri Chourasta, Nagole, Hyderabad';
    const phone = cafeSettings?.phone || '9000407970';
    const email = adminUser?.email || 'kanchicafe@gmail.com';
    const gstNumber = cafeSettings?.gst || '36AFNFS9271D1ZJ';

    // Formatting Invoice numbers & dates
    const dateObj = new Date(order.createdAt);
    const formattedDate = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const formattedTime = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    // Format invoice number: INV-YYYYMMDD-suffix
    const dateStamp = dateObj.toISOString().slice(0, 10).replace(/[-]/g, '');
    const suffix = order.kotNumber ? order.kotNumber.replace('KOT-', '') : order.id.slice(-4).toUpperCase();
    const invoiceNumber = `INV-${dateStamp}-${suffix}`;

    // Create PDF document
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));

    const pdfPromise = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      doc.on('error', (err) => {
        reject(err);
      });
    });

    // Color definitions (Coffee Brown & Gold)
    const primaryColor = '#24140A'; // Coffee Brown
    const goldColor = '#D4AF37';    // Gold
    const lightCream = '#FAF6EE';   // Light Cream background

    // Cafe branding header
    doc.fillColor(primaryColor);
    doc.font('Helvetica-Bold').fontSize(26).text(cafeName.toUpperCase(), { align: 'center' });
    doc.font('Helvetica-Oblique').fontSize(10).fillColor(goldColor).text('Premium Cafe & Restaurant', { align: 'center' });
    doc.moveDown(0.5);

    doc.font('Helvetica').fontSize(9).fillColor('#555555');
    doc.text(`Address: ${address}`, { align: 'center' });
    doc.text(`Phone: +91 ${phone} | Email: ${email}`, { align: 'center' });

    // Check if FSSAI is configured dynamically on cafeSettings (e.g. if present in DB)
    const fssai = (cafeSettings as any)?.fssai;
    const fssaiText = fssai ? ` | FSSAI: ${fssai}` : '';
    doc.text(`GSTIN: ${gstNumber}${fssaiText}`, { align: 'center' });
    doc.moveDown(1);

    // Decorative Gold divider
    doc.strokeColor(goldColor).lineWidth(1.5).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown(1);

    // TAX INVOICE Title
    doc.font('Helvetica-Bold').fontSize(16).fillColor(primaryColor).text('TAX INVOICE', { align: 'center' });
    doc.moveDown(0.5);

    // Left block: Invoice Metadata
    const metaY = doc.y;
    doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor);
    doc.text('INVOICE DETAILS:', 40, metaY);
    doc.font('Helvetica').fontSize(9).fillColor('#333333');
    doc.text(`Invoice No   : ${invoiceNumber}`, 40, metaY + 15);
    doc.text(`Invoice Date : ${formattedDate}`, 40, metaY + 28);
    doc.text(`Invoice Time : ${formattedTime}`, 40, metaY + 41);
    doc.text(`Order/KOT    : ${order.kotNumber || 'PENDING'}`, 40, metaY + 54);

    // Right block: Billing details & customer
    doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor);
    doc.text('BILLED TO:', 300, metaY);
    doc.font('Helvetica').fontSize(9).fillColor('#333333');
    doc.text(`Name    : ${order.customer.name}`, 300, metaY + 15);
    doc.text(`Mobile  : +91 ${order.customer.mobile}`, 300, metaY + 28);
    doc.text(`Table   : Table ${order.table.tableNumber}`, 300, metaY + 41);
    doc.text(`Payment : ${order.paymentStatus} (${order.paymentMethod})`, 300, metaY + 54);

    doc.moveDown(2);

    // Item Table
    const tableTop = doc.y + 10;
    doc.strokeColor('#E2E8F0').lineWidth(0.5).moveTo(40, tableTop).lineTo(555, tableTop).stroke();

    // Table Header
    doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor);
    doc.text('Item Description', 45, tableTop + 6);
    doc.text('Qty', 320, tableTop + 6, { width: 40, align: 'center' });
    doc.text('Unit Price', 380, tableTop + 6, { width: 70, align: 'right' });
    doc.text('Amount', 470, tableTop + 6, { width: 80, align: 'right' });

    doc.strokeColor(primaryColor).lineWidth(1).moveTo(40, tableTop + 20).lineTo(555, tableTop + 20).stroke();

    let currentY = tableTop + 22;
    doc.font('Helvetica').fontSize(9).fillColor('#333333');

    // Display each item row
    order.items.forEach((item, index) => {
      // Row background zebra-striping
      if (index % 2 === 0) {
        doc.fillColor(lightCream).rect(40, currentY, 515, 18).fill();
      }
      doc.fillColor('#333333');
      doc.text(item.menuItemName, 45, currentY + 4);
      doc.text(String(item.quantity), 320, currentY + 4, { width: 40, align: 'center' });
      doc.text(`Rs.${item.unitPrice.toFixed(2)}`, 380, currentY + 4, { width: 70, align: 'right' });
      const rowTotal = item.unitPrice * item.quantity;
      doc.text(`Rs.${rowTotal.toFixed(2)}`, 470, currentY + 4, { width: 80, align: 'right' });
      currentY += 18;
    });

    doc.strokeColor('#E2E8F0').lineWidth(0.5).moveTo(40, currentY).lineTo(555, currentY).stroke();
    currentY += 10;

    // Summary Section (using strictly stored order values)
    const summaryX = 350;
    doc.font('Helvetica').fontSize(9).fillColor('#555555');

    doc.text('Subtotal:', summaryX, currentY);
    doc.font('Helvetica-Bold').text(`Rs.${order.subtotal.toFixed(2)}`, 470, currentY, { width: 80, align: 'right' });
    currentY += 14;

    const gstRate = order.subtotal > 0 ? Math.round((order.taxAmount / order.subtotal) * 100) : 0;
    doc.font('Helvetica').text(`GST (${gstRate}%):`, summaryX, currentY);
    doc.font('Helvetica-Bold').text(`Rs.${order.taxAmount.toFixed(2)}`, 470, currentY, { width: 80, align: 'right' });
    currentY += 14;

    doc.font('Helvetica').text('Discount:', summaryX, currentY);
    doc.font('Helvetica-Bold').text('Rs.0.00', 470, currentY, { width: 80, align: 'right' });
    currentY += 18;

    // Double line for total
    doc.strokeColor(goldColor).lineWidth(1).moveTo(summaryX, currentY).lineTo(555, currentY).stroke();
    currentY += 4;

    doc.font('Helvetica-Bold').fontSize(11).fillColor(primaryColor).text('Grand Total:', summaryX, currentY);
    doc.text(`Rs.${order.totalAmount.toFixed(2)}`, 470, currentY, { width: 80, align: 'right' });
    currentY += 20;

    doc.strokeColor(goldColor).lineWidth(1).moveTo(summaryX, currentY).lineTo(555, currentY).stroke();
    currentY += 20;

    // QR Code generation in footer
    const qrText = `Invoice: ${invoiceNumber}\nKOT: ${order.kotNumber || 'PENDING'}\nMobile: ${order.customer.mobile}\nAmount: Rs.${order.totalAmount.toFixed(2)}\nDate: ${formattedDate}`;
    const qrBuffer = await QRCode.toBuffer(qrText, { margin: 1, width: 80, type: 'png' });

    const footerY = 700; // Absolute bottom positioning
    doc.image(qrBuffer, 40, footerY - 30, { width: 70 });

    doc.font('Helvetica-Bold').fontSize(9).fillColor(primaryColor);
    doc.text('Scan QR to verify Invoice', 120, footerY - 15);
    doc.font('Helvetica').fontSize(8).fillColor('#777777');
    doc.text('This is a computer-generated tax invoice. No signature required.', 120, footerY - 3);
    doc.font('Helvetica-Bold').fontSize(10).fillColor(goldColor).text('Thank you for visiting Kanchi Cafe! Please visit again.', 40, footerY + 25, { align: 'center', width: 515 });

    doc.end();

    // Await full buffer concatenation and send response
    const pdfBuffer = await pdfPromise;

    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Invoice_${invoiceNumber}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.end(pdfBuffer);
  } catch (error: any) {
    console.error('Invoice generation error:', error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: 'Failed to generate invoice PDF' });
    }
  }
}
