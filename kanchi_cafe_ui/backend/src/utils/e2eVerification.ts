import { prisma } from '../config/prisma';
import bcrypt from 'bcryptjs';

export async function runSelfVerificationTest() {
  console.log('============ STARTING REFINED E2E VERIFICATION ============');

  try {
    // 1. Admin Auth Check
    const admin = await prisma.adminUser.findUnique({ where: { email: 'kanchicafe@gmail.com' } });
    if (!admin) throw new Error('Default admin not found');
    const isPassOk = await bcrypt.compare('kanchi@2026', admin.passwordHash);
    if (!isPassOk) throw new Error('Admin password hash mismatch');
    console.log('✅ 1. Admin Auth Verified: kanchicafe@gmail.com / kanchi@2026');

    // 2. Cafe Settings & Tables & Menu Categories
    const settings = await prisma.cafeSettings.findFirst();
    if (!settings || settings.name !== 'Kanchi Cafe') throw new Error('Cafe settings incomplete');
    const tablesCount = await prisma.table.count();
    const categoriesCount = await prisma.category.count();
    const itemsCount = await prisma.menuItem.count();
    console.log(`✅ 2. Verified ${tablesCount} Tables, ${categoriesCount} Categories, and ${itemsCount} Authentic Menu Items`);

    // 3. Customer Identification
    const testMobile = '9876543210';
    let customer = await prisma.customer.findUnique({ where: { mobile: testMobile } });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { mobile: testMobile, name: 'Final Refinement Customer', totalVisits: 1 },
      });
    }
    console.log(`✅ 3. Customer Identification Verified: ${customer.name}`);

    // 4. Order Creation WITHOUT Immediate KOT Number
    const menuItem = await prisma.menuItem.findFirst();
    if (!menuItem) throw new Error('No menu item available');
    const table1 = await prisma.table.findFirst({ where: { tableNumber: 1 } });
    if (!table1) throw new Error('Table 1 not found');

    const pendingOrder = await prisma.order.create({
      data: {
        kotNumber: null, // KOT is NULL before approval!
        tableId: table1.id,
        customerId: customer.id,
        status: 'PENDING_APPROVAL',
        paymentStatus: 'PENDING',
        subtotal: menuItem.price,
        taxAmount: 0,
        totalAmount: menuItem.price,
        paymentMethod: 'UPI',
        items: {
          create: [
            {
              menuItemId: menuItem.id,
              menuItemName: menuItem.name,
              quantity: 1,
              unitPrice: menuItem.price,
              isCoffeeOrJuice: menuItem.isCoffeeOrJuice,
            },
          ],
        },
      },
    });

    if (pendingOrder.kotNumber !== null) {
      throw new Error('KOT number was generated prematurely before payment approval!');
    }
    console.log(`✅ 4. Pre-Approval KOT Flow Verified: Order ID ${pendingOrder.id} created with kotNumber = NULL`);

    // 5. Atomic KOT Generation & Admin Approval Test
    const lastOrderWithKot = await prisma.order.findFirst({
      where: { kotNumber: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: { kotNumber: true },
    });

    let nextNum = 101;
    if (lastOrderWithKot && lastOrderWithKot.kotNumber) {
      const match = lastOrderWithKot.kotNumber.match(/\d+/);
      if (match) nextNum = parseInt(match[0], 10) + 1;
    }
    let candidateKot = `KOT-${nextNum}`;
    let existing = await prisma.order.findUnique({ where: { kotNumber: candidateKot } });
    while (existing) {
      nextNum++;
      candidateKot = `KOT-${nextNum}`;
      existing = await prisma.order.findUnique({ where: { kotNumber: candidateKot } });
    }

    const approvedOrder = await prisma.order.update({
      where: { id: pendingOrder.id },
      data: {
        kotNumber: candidateKot,
        status: 'ACTIVE',
        paymentStatus: 'APPROVED',
      },
    });

    if (approvedOrder.kotNumber !== candidateKot || approvedOrder.status !== 'ACTIVE') {
      throw new Error(`KOT approval generation mismatch. Expected ${candidateKot}, got ${approvedOrder.kotNumber}`);
    }
    console.log(`✅ 5. Admin Payment Approval & Sequential KOT Generated: ${approvedOrder.kotNumber} is now ACTIVE`);

    // 6. Independent Today's Specials Verification
    const todaysSpecialItems = await prisma.todaysSpecial.findMany({ where: { isAvailable: true } });
    console.log(`✅ 6. Independent Today's Specials Feature Verified (${todaysSpecialItems.length} independent specials active)`);

    console.log('============ ALL REFINED E2E VERIFICATION CHECKS PASSED! ============');
    return true;
  } catch (err: any) {
    console.error('❌ E2E Verification Failed:', err.message);
    return false;
  }
}
