import { MongoClient, Db } from 'mongodb'
import { env } from './env'

let db: Db | null = null
let client: MongoClient | null = null

export async function connectDB(): Promise<Db> {
  if (db) return db

  try {
    client = new MongoClient(env.MONGODB_URI)
    await client.connect()
    
    db = client.db()
    console.log('✅ MongoDB connected successfully to database:', db.databaseName)
    
    // Ensure collections exist
    await ensureCollections()
    
    // Create indexes
    await createIndexes()
    
    return db
  } catch (error) {
    console.error('❌ MongoDB connection error:', error)
    throw error
  }
}

async function ensureCollections() {
  if (!db) return
  
  const collections = await db.listCollections().toArray()
  const collectionNames = collections.map(c => c.name)
  
  // Create users collection if it doesn't exist
  if (!collectionNames.includes('users')) {
    await db.createCollection('users')
    console.log('✅ Created users collection')
  }
  
  // Create transactions collection if it doesn't exist
  if (!collectionNames.includes('transactions')) {
    await db.createCollection('transactions')
    console.log('✅ Created transactions collection')
  }
  
  // Create referrals collection if it doesn't exist
  if (!collectionNames.includes('referrals')) {
    await db.createCollection('referrals')
    console.log('✅ Created referrals collection')
  }
}

async function createIndexes() {
  if (!db) return
  
  const usersCollection = db.collection('users')
  
  try {
    // Index email (unique)
    await usersCollection.createIndex({ email: 1 }, { unique: true })
    console.log('✅ Index created: email')
  } catch (err: any) {
    if (err.code === 86) {
      console.log('⚠️ Index email already exists, skipping...')
    } else {
      console.log('⚠️ Could not create email index:', err.message)
    }
  }
  
  try {
    // Index referralCode (unique, sparse)
    await usersCollection.createIndex(
      { referralCode: 1 }, 
      { unique: true, sparse: true }
    )
    console.log('✅ Index created: referralCode')
  } catch (err: any) {
    if (err.code === 86) {
      console.log('⚠️ Index referralCode already exists, skipping...')
    } else {
      console.log('⚠️ Could not create referralCode index:', err.message)
    }
  }
  
  try {
    // Index qrCode
    await usersCollection.createIndex({ qrCode: 1 })
    console.log('✅ Index created: qrCode')
  } catch (err: any) {
    console.log('⚠️ Could not create qrCode index:', err.message)
  }
  
  console.log('✅ Database setup complete')
}

export async function disconnectDB(): Promise<void> {
  if (client) {
    await client.close()
    console.log('❌ MongoDB disconnected')
  }
}

export function getDB(): Db {
  if (!db) throw new Error('Database not connected')
  return db
}