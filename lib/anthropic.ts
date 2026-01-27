import Anthropic from '@anthropic-ai/sdk'
import { getApiKey } from './api-keys'

export async function createAnthropicClient() {
  // 1. 개인/공유 API 키 확인
  let apiKey = await getApiKey('anthropic')
  
  // 2. 환경 변수 fallback
  if (!apiKey) {
    apiKey = process.env.ANTHROPIC_API_KEY || null
  }
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다.')
  }
  
  return new Anthropic({ apiKey })
}
