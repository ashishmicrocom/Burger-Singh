import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Onboarding from '../models/Onboarding.js';
import Outlet from '../models/Outlet.js';

dotenv.config();

const checkApplications = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const applications = await Onboarding.find().populate('outlet', 'name code fieldCoach').limit(20);
    
    console.log(`📋 All onboarding applications (${applications.length}):\n`);
    for (const app of applications) {
      const outlet = await Outlet.findById(app.outlet).populate('fieldCoach', 'name email');
      console.log(`- ${app.fullName}`);
      console.log(`  Outlet: ${outlet?.name} (${outlet?.code})`);
      console.log(`  Field Coach: ${outlet?.fieldCoach?.name || 'NOT ASSIGNED'} (${outlet?.fieldCoach?.email || 'N/A'})`);
      console.log(`  Status: ${app.status}`);
      console.log(`  Created: ${app.createdAt}\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkApplications();
