import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Onboarding from '../models/Onboarding.js';
import Outlet from '../models/Outlet.js';
import User from '../models/User.js';

dotenv.config();

const checkData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check onboarding applications
    const totalApps = await Onboarding.countDocuments();
    console.log(`📊 Total onboarding applications: ${totalApps}`);

    // Check outlets with field coaches
    const outlets = await Outlet.find({ fieldCoach: { $ne: null } }).populate('fieldCoach', 'name email');
    console.log(`\n🏪 Outlets with field coaches assigned: ${outlets.length}`);
    outlets.forEach(o => {
      console.log(`   - ${o.name} (${o.code}) -> ${o.fieldCoach?.name} (${o.fieldCoach?.email})`);
    });

    // Check field coaches
    const coaches = await User.find({ role: 'field_coach' });
    console.log(`\n👥 Field coaches in system: ${coaches.length}`);
    coaches.forEach(c => {
      console.log(`   - ${c.name} (${c.email})`);
    });

    // Check applications for the test coach
    const testCoach = await User.findOne({ email: 'coach@burgersingh.com' });
    if (testCoach) {
      const assignedOutlets = await Outlet.find({ fieldCoach: testCoach._id });
      const outletIds = assignedOutlets.map(o => o._id);
      const appsForCoach = await Onboarding.countDocuments({
        outlet: { $in: outletIds }
      });
      console.log(`\n📋 Applications for coach@burgersingh.com: ${appsForCoach}`);
      console.log(`   Assigned to ${assignedOutlets.length} outlets: ${assignedOutlets.map(o => o.code).join(', ')}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

checkData();
