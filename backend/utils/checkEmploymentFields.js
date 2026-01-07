import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Onboarding from '../models/Onboarding.js';

dotenv.config();

const checkEmploymentFields = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // Find the latest submitted applications
    const applications = await Onboarding.find({
      status: { $in: ['submitted', 'pending_approval', 'approved', 'rejected'] }
    })
    .sort({ createdAt: -1 })
    .limit(3)
    .lean();

    console.log(`\n📊 Found ${applications.length} applications\n`);

    applications.forEach((app, index) => {
      console.log(`\n=== Application ${index + 1} ===`);
      console.log('Name:', app.fullName);
      console.log('Status:', app.status);
      console.log('Created:', app.createdAt);
      console.log('\n🔍 Employment Details:');
      console.log('  covidVaccinated:', app.covidVaccinated, typeof app.covidVaccinated);
      console.log('  hepatitisVaccinated:', app.hepatitisVaccinated, typeof app.hepatitisVaccinated);
      console.log('  typhoidVaccinated:', app.typhoidVaccinated, typeof app.typhoidVaccinated);
      console.log('  designation:', JSON.stringify(app.designation), typeof app.designation);
      console.log('  dateOfJoining:', app.dateOfJoining, typeof app.dateOfJoining);
      console.log('  fieldCoach:', JSON.stringify(app.fieldCoach), typeof app.fieldCoach);
      console.log('  department:', JSON.stringify(app.department), typeof app.department);
      console.log('  storeName:', JSON.stringify(app.storeName), typeof app.storeName);
    });

    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

checkEmploymentFields();
