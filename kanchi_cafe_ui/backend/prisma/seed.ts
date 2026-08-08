import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface MenuItemSeed {
  name: string;
  price: number;
  isPopular?: boolean;
  isCoffeeOrJuice?: boolean;
}

interface CategorySeed {
  category: string;
  sortOrder: number;
  items: MenuItemSeed[];
}

async function main() {
  console.log('🌱 Seeding Kanchi Cafe menu categories, items & independent Today Specials...');

  // 1. Seed Admin User
  const defaultEmail = 'kanchicafe@gmail.com';
  const defaultPassword = 'kanchi@123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  const admin = await prisma.adminUser.upsert({
    where: { email: defaultEmail },
    update: { passwordHash: hashedPassword, name: 'Kanchi Admin' },
    create: {
      email: defaultEmail,
      passwordHash: hashedPassword,
      name: 'Kanchi Admin',
      role: 'ADMIN',
    },
  });
  console.log(`✅ Default Admin Seeded: ${admin.email}`);

  // 2. Seed Cafe Settings
  const cafeSettings = await prisma.cafeSettings.findFirst();
  if (!cafeSettings) {
    await prisma.cafeSettings.create({
      data: {
        name: 'Kanchi Cafe',
        address: 'Alkapuri Chourasta, Nagole',
        phone: '9000407970',
        gst: '36AFNFS9271D1ZJ',
        upiId: '8978882601@ybl',
        customerNotifDelayMin: 30,
        reminderIntervalMin: 15,
        autoCompleteTimeoutMin: 60,
        enableGst: false,
        gstPercentage: 5.0,
      },
    });
    console.log('✅ Cafe Settings Seeded');
  }

  // 3. Seed Printer Settings
  const printerSettings = await prisma.printerSettings.findFirst();
  if (!printerSettings) {
    await prisma.printerSettings.create({
      data: {
        printer1Name: 'Kitchen Printer (Food)',
        printer1Categories: 'IDLY SECTION,DOSA SECTION,SNACKS & VADA',
        printer2Name: 'Beverage Printer (Juices & Beverages)',
        printer2Categories: 'JUICES & BEVERAGES',
      },
    });
    console.log('✅ Printer Settings Seeded');
  }

  // 4. Seed 15 Tables
  for (let i = 1; i <= 15; i++) {
    await prisma.table.upsert({
      where: { tableNumber: i },
      update: { active: true },
      create: { tableNumber: i, qrCodeUrl: `/table/${i}`, active: true },
    });
  }
  console.log('✅ 15 Tables Seeded');

  // Clear existing menu data for clean seed
  await prisma.orderItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.order.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.todaysSpecial.deleteMany();

  // 5. Seed Independent Today's Specials
  const sampleSpecials = [
    { name: 'Special Mini Meals', price: 199, description: 'Sambar rice, curd rice, puri, vada & dessert combo' },
    { name: "Chef's Choice Dosa", price: 189, description: 'Triple podi ghee roast with special chutneys' },
    { name: 'Sunday Combo', price: 229, description: 'Special bisi bele bath, ghee vada & cold coffee' },
    { name: 'Special Falooda', price: 209, description: 'Rich dry-fruit rose falooda with matka kulfi' },
    { name: 'Special Breakfast Combo', price: 149, description: '2 Idly + 1 Vada + Filter Coffee' },
  ];

  for (let i = 0; i < sampleSpecials.length; i++) {
    const s = sampleSpecials[i];
    await prisma.todaysSpecial.create({
      data: {
        name: s.name,
        price: s.price,
        description: s.description,
        isAvailable: true,
        sortOrder: i + 1,
      },
    });
  }
  console.log('✅ Independent Today Specials Seeded');

  // 6. Authentic Kanchi Cafe Menu Categories & Items
  const menuData: CategorySeed[] = [
    {
      category: 'IDLY SECTION',
      sortOrder: 1,
      items: [
        { name: 'Idly', price: 62 },
        { name: 'Ghee Podi Idly', price: 99, isPopular: true },
        { name: 'Kanchi Rava Idly', price: 79 },
        { name: 'Kanchi Ghee Podi Rava Idly', price: 99 },
        { name: 'Plain Thatte Idly', price: 69 },
        { name: 'Ghee Thatte Idly', price: 99, isPopular: true },
        { name: 'Butter Thatte Idly', price: 109 },
        { name: 'Ghee Podi Thatte Idly', price: 129, isPopular: true },
        { name: 'Ghee Sambar Button Idly', price: 139 },
        { name: 'Khara Bath (Upma)', price: 89 },
        { name: 'Ghee Khara Bath (Upma)', price: 119 },
        { name: 'Ghee Pongal', price: 149, isPopular: true },
        { name: 'Temple Pulihora', price: 129 },
        { name: 'Bisibele Bath / Sambar Rice', price: 129 },
        { name: 'Lemon Rice', price: 109 },
        { name: 'Veg Biryani', price: 149 },
        { name: 'Curd Rice', price: 119 },
        { name: 'Thatte Idly + Vada', price: 119 },
        { name: 'Idly (2) + Vada + Filter Coffee', price: 129, isPopular: true },
        { name: 'Lemon Rice + Curd Rice', price: 159 },
        { name: 'Veg Biryani + Curd Rice', price: 159 },
        { name: 'Sambar Rice + Curd Rice', price: 159 },
        { name: 'Kesari Bath', price: 89 },
        { name: 'Chakkara Pongal', price: 109 },
        { name: 'Carrot Halwa', price: 119 },
        { name: 'Tiffin Combo 1', price: 129 },
        { name: 'Tiffin Combo 2', price: 165 },
        { name: 'Tiffin Combo 3', price: 165 },
        { name: 'Spl Combo (2 Idly + 1 Vada)', price: 99 },
      ],
    },
    {
      category: 'DOSA SECTION',
      sortOrder: 2,
      items: [
        { name: 'Ghee Plain Dosa', price: 129 },
        { name: 'Ghee Podi Dosa', price: 159, isPopular: true },
        { name: 'Paper Ghee Roast Dosa / Topi Dosa', price: 159 },
        { name: 'Ragi Dosa', price: 139 },
        { name: 'Multi Grain Dosa', price: 149 },
        { name: 'Kal Dosa Vada Curry', price: 169 },
        { name: 'Garlic Roast Dosa', price: 189 },
        { name: 'Chitti Pesarattu', price: 179 },
        { name: 'Ghee Podi Masala Dosa', price: 179, isPopular: true },
        { name: 'Open Butter Masala Dosa', price: 189 },
        { name: 'Mysore Masala Dosa', price: 189, isPopular: true },
        { name: 'Plain Paper Dosa', price: 119 },
        { name: 'Onion Dosa', price: 149 },
        { name: 'Onion Uttapam', price: 149 },
        { name: 'Rava Dosa', price: 159 },
        { name: 'Rava Onion Dosa', price: 179 },
        { name: 'Rava Onion Podi Masala Dosa', price: 189 },
        { name: 'Paneer Masala Dosa', price: 169 },
        { name: 'Family Dosa', price: 289 },
        { name: 'Bun Parota', price: 129 },
        { name: 'Malabar Parota', price: 149 },
        { name: 'Ceylone Parota', price: 169 },
        { name: 'Chapati Kurma', price: 109 },
      ],
    },
    {
      category: 'SNACKS & VADA',
      sortOrder: 3,
      items: [
        { name: 'Poori Masala', price: 129, isPopular: true },
        { name: 'Chole Bhature', price: 199 },
        { name: 'Mirchi Bajji', price: 99 },
        { name: 'Onion Pakoda', price: 99 },
        { name: 'Punugulu', price: 99 },
        { name: 'Mysore Bonda', price: 109 },
        { name: 'Challa Punugulu', price: 99 },
        { name: 'Medhu Vada', price: 99 },
        { name: 'Ghee Sambar Vada', price: 129, isPopular: true },
        { name: 'Masala Vada', price: 109 },
        { name: 'Aamras Poori', price: 139 },
        { name: 'Kanchi Thali', price: 229 },
        { name: 'Kanchi Weekend Thali', price: 279 },
      ],
    },
    {
      category: 'JUICES & BEVERAGES',
      sortOrder: 4,
      items: [
        { name: 'Elaneer Payasam', price: 149, isCoffeeOrJuice: true },
        { name: 'Matka Lassi', price: 149, isCoffeeOrJuice: true },
        { name: 'Rose Matka Lassi', price: 179, isCoffeeOrJuice: true },
        { name: 'Mango Matka Lassi', price: 179, isCoffeeOrJuice: true },
        { name: 'Black Current Matka Lassi', price: 179, isCoffeeOrJuice: true },
        { name: 'Lemon Soda Sweet & Salt', price: 109, isCoffeeOrJuice: true },
        { name: 'Nannari Sharbat', price: 149, isCoffeeOrJuice: true },
        { name: 'Rose Milk', price: 159, isCoffeeOrJuice: true },
        { name: 'Chilled Badam Milk', price: 179, isCoffeeOrJuice: true },
        { name: 'Pista Milk', price: 199, isCoffeeOrJuice: true },
        { name: 'Chikoo Milkshake', price: 229, isCoffeeOrJuice: true },
        { name: 'Strawberry Banana Milkshake', price: 249, isCoffeeOrJuice: true },
        { name: 'Arabian Date & Nut Shake', price: 249, isCoffeeOrJuice: true },
        { name: 'Vanilla Milkshake', price: 179, isCoffeeOrJuice: true },
        { name: 'Chocolate Milkshake', price: 219, isCoffeeOrJuice: true },
        { name: 'Butter Scotch Milkshake', price: 219, isCoffeeOrJuice: true },
        { name: 'Oreo Milkshake', price: 239, isCoffeeOrJuice: true },
        { name: 'Nutella Milkshake', price: 249, isCoffeeOrJuice: true },
        { name: 'Lemon Juice', price: 89, isCoffeeOrJuice: true },
        { name: 'Grape Lemon', price: 129, isCoffeeOrJuice: true },
        { name: 'Grape Pure', price: 129, isCoffeeOrJuice: true },
        { name: 'Pineapple Pure', price: 149, isCoffeeOrJuice: true },
        { name: 'Mosambi Pure', price: 179, isCoffeeOrJuice: true },
        { name: 'Orange Pure', price: 189, isCoffeeOrJuice: true },
        { name: 'Musk Melon Pure', price: 149, isCoffeeOrJuice: true },
        { name: 'Lime Mint Cooler', price: 109, isCoffeeOrJuice: true },
        { name: 'Water Melon Mint', price: 179, isCoffeeOrJuice: true },
        { name: 'Pomegranate Mint', price: 209, isCoffeeOrJuice: true },
        { name: 'Blue Lagoon Mocktail', price: 199, isCoffeeOrJuice: true },
        { name: 'Fruit Custard', price: 179, isCoffeeOrJuice: true },
        { name: 'Falooda', price: 209, isCoffeeOrJuice: true },
        { name: 'Cold Coffee', price: 159, isCoffeeOrJuice: true, isPopular: true },
        { name: 'Nutella Cold Coffee', price: 219, isCoffeeOrJuice: true },
        { name: 'Filter Coffee', price: 59, isCoffeeOrJuice: true, isPopular: true },
        { name: 'Hot Badam Milk', price: 89, isCoffeeOrJuice: true },
        { name: 'Tea', price: 40, isCoffeeOrJuice: true },
        { name: 'Green Tea', price: 45, isCoffeeOrJuice: true },
        { name: 'Ginger Tea', price: 45, isCoffeeOrJuice: true },
        { name: 'Lemon Tea', price: 35, isCoffeeOrJuice: true },
        { name: 'Masala Tea', price: 45, isCoffeeOrJuice: true },
        { name: 'Water Bottle', price: 20, isCoffeeOrJuice: true },
        { name: 'Apricot Delight', price: 159, isCoffeeOrJuice: true },
        { name: 'Jeera Butter Milk', price: 129, isCoffeeOrJuice: true },
        { name: 'Banana Milkshake', price: 159, isCoffeeOrJuice: true },
      ],
    },
  ];

  for (const catData of menuData) {
    const cat = await prisma.category.create({
      data: { name: catData.category, sortOrder: catData.sortOrder, active: true },
    });

    for (let i = 0; i < catData.items.length; i++) {
      const it = catData.items[i];
      await prisma.menuItem.create({
        data: {
          name: it.name,
          price: it.price,
          categoryId: cat.id,
          imageUrl: null,
          isAvailable: true,
          isPopular: it.isPopular || false,
          isCoffeeOrJuice: it.isCoffeeOrJuice || false,
          sortOrder: i + 1,
        },
      });
    }
  }

  console.log('✅ Authentic Kanchi Cafe Menu Seeded Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
