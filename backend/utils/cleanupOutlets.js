import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Outlet from '../models/Outlet.js';

dotenv.config();

const checkOutlets = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    console.log('📊 Database:', mongoose.connection.db.databaseName);
    console.log('📦 Collection:', 'outlets');

    // Find all outlets without any filter
    const allOutlets = await Outlet.find({}).lean();
    console.log(`\n📊 Total outlets in database: ${allOutlets.length}`);

    if (allOutlets.length > 0) {
      console.log('\n📋 All outlets:');
      allOutlets.forEach((outlet, index) => {
        console.log(`\n${index + 1}. ${outlet.name} (${outlet.code})`);
        console.log(`   - ID: ${outlet._id}`);
        console.log(`   - Active: ${outlet.isActive}`);
        console.log(`   - City: ${outlet.city || 'N/A'}`);
        console.log(`   - Created: ${outlet.createdAt || 'N/A'}`);
      });

      // Count by status
      const activeCount = allOutlets.filter(o => o.isActive).length;
      const inactiveCount = allOutlets.filter(o => !o.isActive).length;
      
      console.log(`\n📊 Summary:`);
      console.log(`   ✅ Active: ${activeCount}`);
      console.log(`   ❌ Inactive: ${inactiveCount}`);
      console.log(`   📦 Total: ${allOutlets.length}`);
    }

    // Check if there are any soft-deleted or hidden records
    const rawOutlets = await mongoose.connection.db.collection('outlets').countDocuments();
    console.log(`\n🔍 Raw collection count: ${rawOutlets}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkOutlets();
