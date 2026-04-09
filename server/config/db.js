const mongoose = require('mongoose')

let cachedConnectionPromise = null

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection
  }

  if (cachedConnectionPromise) {
    return cachedConnectionPromise
  }

  try {
    cachedConnectionPromise = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    })
    const conn = await cachedConnectionPromise
    console.log(`✅ MongoDB Atlas Connected: ${conn.connection.host}`)
    return conn.connection
  } catch (err) {
    cachedConnectionPromise = null
    console.error('❌ MongoDB connection failed:', err.message)
    console.error('👉 Check your MONGO_URI in server/.env')
    throw err
  }
}

module.exports = connectDB
