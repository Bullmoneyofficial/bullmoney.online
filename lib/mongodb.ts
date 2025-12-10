import mongoose from "mongoose";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable in .env.local");
}

/* ---------------------------
   ✅ Mongoose connection
---------------------------- */

let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

export async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      dbName: "bullmoney_shop",
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

/* ---------------------------
   ✅ MongoClient default export
   (backwards compatible with /api/trade)
---------------------------- */

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

const opts = {};

if (process.env.NODE_ENV === "development") {
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(MONGODB_URI, opts);
    globalWithMongo._mongoClientPromise = client.connect();
  }

  clientPromise = globalWithMongo._mongoClientPromise!;
} else {
  client = new MongoClient(MONGODB_URI, opts);
  clientPromise = client.connect();
}






export default clientPromise;

export async function connectToDatabase() {
  const client = await clientPromise;
  const db = client.db();
  return { db };
}