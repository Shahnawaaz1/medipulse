import mongoose from "mongoose";
import fs from "fs";
import path from "path";

function getMongoUri(): string {
  if (process.env.MONGODB_URI) return process.env.MONGODB_URI;
  if (process.env.MONGO_URI) return process.env.MONGO_URI;

  try {
    const envLocalPath = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envLocalPath)) {
      const content = fs.readFileSync(envLocalPath, "utf8");
      const match = content.match(/MONGODB_URI\s*=\s*([^\r\n]+)/);
      if (match && match[1]) {
        return match[1].trim().replace(/^["']|["']$/g, "");
      }
    }
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf8");
      const match = content.match(/MONGODB_URI\s*=\s*([^\r\n]+)/);
      if (match && match[1]) {
        return match[1].trim().replace(/^["']|["']$/g, "");
      }
    }
  } catch {
    // fallback
  }

  return "mongodb://127.0.0.1:27017/hospital_management";
}

interface GlobalMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseGlobal: GlobalMongoose | undefined;
}

let cached = global.mongooseGlobal;

if (!cached) {
  cached = global.mongooseGlobal = { conn: null, promise: null };
}

export async function connectToDatabase() {
  const uri = getMongoUri();

  if (cached?.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached?.promise || mongoose.connection.readyState === 0) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 20,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
    };

    cached!.promise = mongoose.connect(uri, opts).then((m) => {
      return m;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e) {
    cached!.promise = null;
    cached!.conn = null;
    console.error("MongoDB connection error:", e);
    throw e;
  }

  return cached!.conn;
}

export const connectDB = connectToDatabase;
export default connectToDatabase;
