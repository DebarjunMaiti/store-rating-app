import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clean existing records
  await prisma.rating.deleteMany();
  await prisma.store.deleteMany();
  await prisma.user.deleteMany();

  const defaultPassword = await bcrypt.hash('Password@123', 10);

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      name: 'System Administrator Root', // 25 chars
      email: 'admin@example.com',
      password: defaultPassword,
      address: '100 Corporate Plaza, Suite 500, Metro City, NY 10001',
      role: 'ADMIN'
    }
  });

  // 2. Create Store Owners
  const owner1 = await prisma.user.create({
    data: {
      name: 'Store Owner Michael Scott', // 25 chars
      email: 'owner1@example.com',
      password: defaultPassword,
      address: '1725 Slough Avenue, Scranton, PA 18540',
      role: 'STORE_OWNER'
    }
  });

  const owner2 = await prisma.user.create({
    data: {
      name: 'Store Owner Samantha Green', // 26 chars
      email: 'owner2@example.com',
      password: defaultPassword,
      address: '450 Market Street, San Francisco, CA 94105',
      role: 'STORE_OWNER'
    }
  });

  // 3. Create Normal Users
  const user1 = await prisma.user.create({
    data: {
      name: 'Normal User Jonathan Doe', // 24 chars
      email: 'user1@example.com',
      password: defaultPassword,
      address: '742 Evergreen Terrace, Springfield, OR 97477',
      role: 'USER'
    }
  });

  const user2 = await prisma.user.create({
    data: {
      name: 'Normal User Emily Clark', // 23 chars
      email: 'user2@example.com',
      password: defaultPassword,
      address: '221B Baker Street, Marylebone, London NW1 6XE',
      role: 'USER'
    }
  });

  const user3 = await prisma.user.create({
    data: {
      name: 'Normal User Robert Smith', // 24 chars
      email: 'user3@example.com',
      password: defaultPassword,
      address: '350 Fifth Avenue, Floor 12, New York, NY 10118',
      role: 'USER'
    }
  });

  // 4. Create Stores
  const store1 = await prisma.store.create({
    data: {
      name: 'Tech Haven Electronics Outlet', // 29 chars
      email: 'support@techhavenstore.com',
      address: '120 Silicon Way, Tech District, San Jose, CA 95110',
      ownerId: owner1.id, status: 'APPROVED'
    }
  });

  const store2 = await prisma.store.create({
    data: {
      name: 'Fresh Garden Organic Grocery', // 28 chars
      email: 'contact@freshgardengrocer.com',
      address: '88 Green Valley Road, Boulder, CO 80302',
      ownerId: owner2.id, status: 'APPROVED'
    }
  });

  const store3 = await prisma.store.create({
    data: {
      name: 'Urban Books and Coffee Lounge', // 29 chars
      email: 'hello@urbanbookscoffee.com',
      address: '512 Pine Street, Downtown, Seattle, WA 98101',
      ownerId: null, status: 'APPROVED'
    }
  });

  const store4 = await prisma.store.create({
    data: {
      name: 'Apex Fitness and Wellness Hub', // 29 chars
      email: 'info@apexfitnesswellness.com',
      address: '990 Olympic Blvd, West Los Angeles, CA 90064',
      ownerId: null, status: 'APPROVED'
    }
  });

  // 5. Create Sample Ratings
  // Store 1 ratings
  await prisma.rating.create({
    data: { value: 5, userId: user1.id, storeId: store1.id }
  });
  await prisma.rating.create({
    data: { value: 4, userId: user2.id, storeId: store1.id }
  });
  await prisma.rating.create({
    data: { value: 5, userId: user3.id, storeId: store1.id }
  });

  // Store 2 ratings
  await prisma.rating.create({
    data: { value: 4, userId: user1.id, storeId: store2.id }
  });
  await prisma.rating.create({
    data: { value: 5, userId: user2.id, storeId: store2.id }
  });

  // Store 3 ratings
  await prisma.rating.create({
    data: { value: 3, userId: user3.id, storeId: store3.id }
  });

  console.log('✅ Database seeded successfully!');
  console.log('----------------------------------------------------');
  console.log('Test Accounts (Password for all: Password@123):');
  console.log('  👑 Admin:       admin@example.com');
  console.log('  🏪 Store Owner: owner1@example.com (Tech Haven)');
  console.log('  🏪 Store Owner: owner2@example.com (Fresh Garden)');
  console.log('  👤 Normal User: user1@example.com');
  console.log('  👤 Normal User: user2@example.com');
  console.log('  👤 Normal User: user3@example.com');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });