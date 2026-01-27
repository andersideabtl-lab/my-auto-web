const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
app.use(cors())
app.use(express.json())

const PORT = process.env.PORT || 8080

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'automation-server' })
})

// 프로젝트 생성 엔드포인트
app.post('/api/projects/generate', async (req, res) => {
  try {
    const { projectName, requirements, userId } = req.body

    // TODO: 구현 예정
    res.json({
      success: true,
      message: 'Project generation started',
      jobId: Date.now().toString()
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`🚀 Automation Server running on port ${PORT}`)
})
