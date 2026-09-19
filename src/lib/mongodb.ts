import { MongoClient, Db } from 'mongodb';

const uri = process.env.DATABASE_URL || '';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export async function getMongoDb(): Promise<Db | null> {
  if (!uri) return null;

  try {
    if (process.env.NODE_ENV === 'development') {
      if (!global._mongoClientPromise) {
        client = new MongoClient(uri, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000,
        });
        global._mongoClientPromise = client.connect();
      }
      clientPromise = global._mongoClientPromise;
    } else {
      if (!clientPromise) {
        client = new MongoClient(uri, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          connectTimeoutMS: 5000,
        });
        clientPromise = client.connect();
      }
    }

    const connectedClient = await Promise.race([
      clientPromise,
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error('MongoDB connection timeout')), 5000)
      ),
    ]);

    if (!connectedClient) return null;
    return connectedClient.db('drivepe');
  } catch (err: any) {
    console.warn('[mongodb] MongoDB connection error:', err?.message || err);
    return null;
  }
}
