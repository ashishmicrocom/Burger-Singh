import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import Outlet from '../models/Outlet.js';

dotenv.config();

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing users (optional - comment out if you want to keep existing data)
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Hash passwords manually
    const salt = bcrypt.genSaltSync(10);

    // Create default staff users with hashed passwords
    const users = [
      {
        name: 'Priya Singh',
        email: 'admin@burgersingh.com',
        password: bcrypt.hashSync('admin1234', salt),
        role: 'super_admin',
        phone: '+91 98765 00001'
      },
      {
        name: 'Rajesh Kumar',
        email: 'store@burgersingh.com',
        password: bcrypt.hashSync('store123', salt),
        role: 'store_manager',
        storeCode: 'BS-CP-001',
        storeName: 'Connaught Place',
        phone: '+91 98765 00002'
      },
      {
        name: 'Amit Sharma',
        email: 'coach@burgersingh.com',
        password: bcrypt.hashSync('coach123', salt),
        role: 'field_coach',
        assignedStores: ['BS-CP-001', 'BS-CH-002', 'BS-AW-004'],
        phone: '+91 98765 00003'
      },
      // Additional store managers
      {
        name: 'Sunita Verma',
        email: 'sunita@burgersingh.com',
        password: bcrypt.hashSync('store123', salt),
        role: 'store_manager',
        storeCode: 'BS-CH-002',
        storeName: 'Cyber Hub',
        phone: '+91 98765 00004'
      },
      {
        name: 'Ravi Kumar',
        email: 'ravi@burgersingh.com',
        password: bcrypt.hashSync('store123', salt),
        role: 'store_manager',
        storeCode: 'BS-KR-003',
        storeName: 'Koramangala',
        phone: '+91 98765 00005'
      },
      // Additional field coaches
      {
        name: 'Meera Patel',
        email: 'meera@burgersingh.com',
        password: bcrypt.hashSync('coach123', salt),
        role: 'field_coach',
        assignedStores: ['BS-KR-003'],
        phone: '+91 98765 00006'
      }
    ];

    // Use insertMany to bypass save hooks
    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} users successfully`);

    // Assign field coaches to outlets
    console.log('\n🔗 Assigning field coaches to outlets...');
    
    const amitSharma = createdUsers.find(u => u.email === 'coach@burgersingh.com');
    const meeraPatel = createdUsers.find(u => u.email === 'meera@burgersingh.com');
    
    if (amitSharma) {
      // Assign Amit Sharma to CP, Cyber Hub, and Andheri
      await Outlet.updateMany(
        { code: { $in: ['BS-CP-001', 'BS-CH-002', 'BS-AW-004'] } },
        { $set: { fieldCoach: amitSharma._id } }
      );
      console.log(`   ✅ Assigned Amit Sharma to CP, Cyber Hub, and Andheri outlets`);
    }
    
    if (meeraPatel) {
      // Assign Meera Patel to Koramangala
      await Outlet.updateMany(
        { code: { $in: ['BS-KR-003'] } },
        { $set: { fieldCoach: meeraPatel._id } }
      );
      console.log(`   ✅ Assigned Meera Patel to Koramangala outlet`);
    }

    // Display created users
    console.log('\n📋 Created Users:');
    createdUsers.forEach(user => {
      console.log(`   - ${user.name} (${user.role}) - ${user.email}`);
      if (user.storeCode) {
        console.log(`     Store: ${user.storeName} (${user.storeCode})`);
      }
    });

    console.log('\n✅ Seeding completed successfully!');
    console.log('\n🔑 Login Credentials:');
    console.log('   Super Admin: admin@burgersingh.com / admin123');
    console.log('   Store Manager: store@burgersingh.com / store123');
    console.log('   Field Coach: coach@burgersingh.com / coach123');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
