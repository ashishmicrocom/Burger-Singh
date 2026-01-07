import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Onboarding from '../models/Onboarding.js';
import Outlet from '../models/Outlet.js';

dotenv.config();

const fixApplications = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the outlets
    const cpOutlet = await Outlet.findOne({ code: 'BS-CP-001' });
    const chOutlet = await Outlet.findOne({ code: 'BS-CH-002' });
    const krOutlet = await Outlet.findOne({ code: 'BS-KR-003' });

    if (!cpOutlet || !chOutlet || !krOutlet) {
      console.log('❌ Outlets not found');
      process.exit(1);
    }

    // Get all applications
    const applications = await Onboarding.find();
    
    console.log(`📋 Fixing ${applications.length} applications...\n`);

    // Distribute applications among the outlets
    for (let i = 0; i < applications.length; i++) {
      const app = applications[i];
      let assignedOutlet;
      
      // Distribute evenly
      if (i % 3 === 0) {
        assignedOutlet = cpOutlet; // Connaught Place
      } else if (i % 3 === 1) {
        assignedOutlet = chOutlet; // Cyber Hub
      } else {
        assignedOutlet = krOutlet; // Koramangala
      }

      app.outlet = assignedOutlet._id;
      
      // Also ensure status is valid for field coach review
      if (app.status === 'draft') {
        app.status = 'submitted';
      }
      
      await app.save();
      
      console.log(`✅ ${app.fullName} -> ${assignedOutlet.name} (${assignedOutlet.code})`);
    }

    console.log(`\n✅ Fixed ${applications.length} applications!`);
    console.log('\n📊 Distribution:');
    console.log(`   - Connaught Place (coach@burgersingh.com): ${await Onboarding.countDocuments({ outlet: cpOutlet._id })}`);
    console.log(`   - Cyber Hub (coach@burgersingh.com): ${await Onboarding.countDocuments({ outlet: chOutlet._id })}`);
    console.log(`   - Koramangala (meera@burgersingh.com): ${await Onboarding.countDocuments({ outlet: krOutlet._id })}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixApplications();
