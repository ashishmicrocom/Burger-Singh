import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Outlet from '../models/Outlet.js';
import Role from '../models/Role.js';

dotenv.config();

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Outlet.deleteMany({});
    await Role.deleteMany({});
    console.log('🗑️  Cleared existing outlets and roles');

    // Seed Roles
    const roles = [
      {
        id: "cook",
        title: "Cook / Kitchen Staff",
        description: "Prepare delicious burgers and manage kitchen operations",
        category: "employee"
      },
      {
        id: "cashier",
        title: "Cashier / Counter Staff",
        description: "Handle orders, payments and customer service",
        category: "employee"
      },
      {
        id: "delivery",
        title: "Delivery Partner",
        description: "Deliver orders and ensure customer satisfaction",
        category: "employee"
      },
      {
        id: "manager",
        title: "Store Manager",
        description: "Oversee operations and manage team members",
        category: "management"
      }
    ];

    const createdRoles = await Role.insertMany(roles);
    console.log(`✅ Created ${createdRoles.length} roles`);

    // Seed Outlets
    const outlets = [
      {
        code: "BS-CP-001",
        name: "Burger Singh - Connaught Place",
        address: "Block A, CP",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
        phone: "+91 98765 11111",
        email: "cp@burgersingh.com"
      },
      {
        code: "BS-CH-002",
        name: "Burger Singh - Cyber Hub",
        address: "DLF Cyber City",
        city: "Gurugram",
        state: "Haryana",
        pincode: "122002",
        phone: "+91 98765 22222",
        email: "cyberhub@burgersingh.com"
      },
      {
        code: "BS-KR-003",
        name: "Burger Singh - Koramangala",
        address: "5th Block",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560095",
        phone: "+91 98765 33333",
        email: "koramangala@burgersingh.com"
      },
      {
        code: "BS-AW-004",
        name: "Burger Singh - Andheri West",
        address: "Link Road",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400053",
        phone: "+91 98765 44444",
        email: "andheri@burgersingh.com"
      },
      {
        code: "BS-SL-005",
        name: "Burger Singh - Salt Lake",
        address: "Sector V",
        city: "Kolkata",
        state: "West Bengal",
        pincode: "700091",
        phone: "+91 98765 55555",
        email: "saltlake@burgersingh.com"
      },
      {
        code: "BS-BH-006",
        name: "Burger Singh - Banjara Hills",
        address: "Road No. 12",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500034",
        phone: "+91 98765 66666",
        email: "banjarahills@burgersingh.com"
      }
    ];

    const createdOutlets = await Outlet.insertMany(outlets);
    console.log(`✅ Created ${createdOutlets.length} outlets`);

    // Display created data
    console.log('\n📋 Seeded Roles:');
    createdRoles.forEach(role => {
      console.log(`   - ${role.title} (${role.id})`);
    });

    console.log('\n📋 Seeded Outlets:');
    createdOutlets.forEach(outlet => {
      console.log(`   - ${outlet.name} (${outlet.code}) - ${outlet.city}`);
    });

    console.log('\n✅ Seeding completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
