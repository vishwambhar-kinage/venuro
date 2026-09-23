import mongoose from 'mongoose';
import { dataStore } from '../models/dataStore.js';

/**
 * Connect to MongoDB Atlas.
 * Falls back to in-memory dataStore silently if URI is missing or connection fails.
 */
export const connectDB = async () => {
  if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('<username>')) {
    console.log('⚠️  [DB] MONGODB_URI not configured — running in In-Memory mode');
    console.log('     → Add MONGODB_URI to server/.env to use MongoDB Atlas');
    return false;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 10000,
    });
    console.log(`✅ [DB] MongoDB Atlas connected: ${mongoose.connection.host}`);
    dataStore.useMongoose = true;
    return true;
  } catch (err) {
    console.log(`⚠️  [DB] MongoDB connection failed (${err.message})`);
    console.log('     → Falling back to In-Memory database mode');
    return false;
  }
};

export default connectDB;
