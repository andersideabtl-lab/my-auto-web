import { GoogleGenerativeAI } from '@google/generative-ai'
import { getApiKey } from './api-keys'

export async function createGeminiClient() {
  // 1. 개인/공유 API 키 확인
  let apiKey = await getApiKey('gemini')
  
  // 2. 환경 변수 fallback
  if (!apiKey) {
    apiKey = process.env.GEMINI_API_KEY || null
  }
  
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY가 설정되지 않았습니다.')
  }
  
  return new GoogleGenerativeAI(apiKey)
}
