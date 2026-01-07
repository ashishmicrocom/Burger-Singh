import mongoose from 'mongoose';

const connectDB = async () => {
    try {

        const mongoURI = process.env.MONGO_URI;
        await mongoose.connect(mongoURI);

        console.log('✅ MongoDB connected successfully');
        console.log('📊 Connected to database:', mongoose.connection.name);

    } catch (error) {
        console.error('❌ MongoDB connection error:', error.message);
        process.exit(1);
    }
}

export default connectDB;