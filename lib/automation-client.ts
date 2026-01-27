const AUTOMATION_URL =
  process.env.AUTOMATION_SERVER_URL || 'http://localhost:8080'

export async function generateProject(params: {
  projectName: string
  requirements: string
  userId: string
}) {
  const response = await fetch(`${AUTOMATION_URL}/api/projects/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  })
  return response.json()
}
