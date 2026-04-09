const { app, ensureDatabaseConnection } = require('../index')

module.exports = async (req, res) => {
  try {
    await ensureDatabaseConnection()
    return app(req, res)
  } catch (error) {
    console.error('Serverless request failed:', error)
    return res.status(500).json({ success: false, message: 'Server error' })
  }
}
