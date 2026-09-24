import { MongoClient, Db } from 'mongodb';

const FALLBACK_MONGO_URI = 'mongodb+srv://ayushhyadav003_db_user:c5KACz6E92VqvS14@cluster0.e0dvycy.mongodb.net/drivepe?retryWrites=true&w=majority';

function getMongoUri(): string {
  return process.env.DATABASE_URL || process.env.MONGODB_URI || FALLBACK_MONGO_URI;
}

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export async function getMongoDb(): Promise<Db | null> {
  const uri = getMongoUri();
  if (!uri) return null;

  try {
    if (process.env.NODE_ENV === 'development') {
      if (!global._mongoClientPromise) {
        client = new MongoClient(uri, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 7000,
          connectTimeoutMS: 7000,
        });
        global._mongoClientPromise = client.connect();
      }
      clientPromise = global._mongoClientPromise;
    } else {
      if (!clientPromise) {
        client = new MongoClient(uri, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 7000,
          connectTimeoutMS: 7000,
        });
        clientPromise = client.connect();
      }
    }

    const connectedClient = await Promise.race([
      clientPromise,
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('MongoDB connection timeout')), 7000)
      ),
    ]);

    if (!connectedClient) return null;
    return connectedClient.db('drivepe');
  } catch (err: any) {
    console.warn('[mongodb] MongoDB connection error:', err?.message || err);
    // Reset so subsequent attempts can reconnect instead of reusing stale rejected promise
    client = null;
    clientPromise = null;
    if (process.env.NODE_ENV === 'development') {
      delete (global as any)._mongoClientPromise;
    }
    return null;
  }
}

