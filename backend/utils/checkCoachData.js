import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Onboarding from '../models/Onboarding.js';
import Outlet from '../models/Outlet.js';
import User from '../models/User.js';

dotenv.config();

const checkCoachData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the test coach
    const coach = await User.findOne({ email: 'coach@burgersingh.com' });
    if (!coach) {
      console.log('❌ Coach not found');
      process.exit(1);
    }

    console.log(`👤 Field Coach: ${coach.name} (${coach.email})`);
    console.log(`   ID: ${coach._id}\n`);

    // Get outlets assigned to this coach
    const assignedOutlets = await Outlet.find({ fieldCoach: coach._id });
    console.log(`📍 Outlets assigned to coach: ${assignedOutlets.length}`);
    assignedOutlets.forEach(o => {
      console.log(`   - ${o.name} (${o.code}) - ID: ${o._id}`);
    });

    const outletIds = assignedOutlets.map(o => o._id);

    // Get all onboarding applications
    const allApps = await Onboarding.find().select('fullName outlet status');
    console.log(`\n📋 All onboarding applications: ${allApps.length}`);
    
    for (const app of allApps) {
      const outlet = await Outlet.findById(app.outlet);
      const isAssignedToCoach = outletIds.some(id => id.equals(app.outlet));
      
      console.log(`\n   - ${app.fullName}`);
      console.log(`     Outlet: ${outlet ? outlet.name + ' (' + outlet.code + ')' : 'NOT FOUND'}`);
      console.log(`     Outlet ID: ${app.outlet}`);
      console.log(`     Status: ${app.status}`);
      console.log(`     Assigned to coach? ${isAssignedToCoach ? '✅ YES' : '❌ NO'}`);
      
      if (outlet && outlet.fieldCoach) {
        const fc = await User.findById(outlet.fieldCoach);
        console.log(`     Field Coach: ${fc ? fc.name + ' (' + fc.email + ')' : 'NOT FOUND'}`);
      } else {
        console.log(`     Field Coach: ⚠️  NOT ASSIGNED TO OUTLET`);
      }
    }

    // Check applications that SHOULD appear for coach
    const appsForCoach = await Onboarding.find({
      outlet: { $in: outletIds },
      status: { $in: ['submitted', 'pending_approval', 'approved', 'rejected'] }
    });

    console.log(`\n\n✅ Applications that SHOULD show for coach@burgersingh.com: ${appsForCoach.length}`);
    appsForCoach.forEach(app => {
      console.log(`   - ${app.fullName} (${app.status})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkCoachData();
