import { createAnthropicClient } from '@/lib/anthropic'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { service, api_key } = body

    if (!service || !api_key) {
      return NextResponse.json(
        { error: '서비스와 API 키가 필요합니다.' },
        { status: 400 }
      )
    }

    let isValid = false
    let errorMessage = ''

    try {
      switch (service) {
        case 'claude':
          // Claude API 테스트
          const anthropic = new (await import('@anthropic-ai/sdk')).default({
            apiKey: api_key,
          })
          await anthropic.messages.create({
            model: 'claude-sonnet-4-5',
            max_tokens: 10,
            messages: [
              {
                role: 'user',
                content: 'test',
              },
            ],
          })
          isValid = true
          break

        case 'gemini':
          // Gemini API 테스트
          const genAI = new GoogleGenerativeAI(api_key)
          const model = genAI.getGenerativeModel({ model: 'gemini-pro' })
          await model.generateContent('test')
          isValid = true
          break

        case 'github':
          // GitHub API 테스트
          const githubResponse = await fetch('https://api.github.com/user', {
            headers: {
              Authorization: `token ${api_key}`,
            },
          })
          if (githubResponse.ok) {
            isValid = true
          } else {
            errorMessage = 'GitHub API 키가 유효하지 않습니다.'
          }
          break

        case 'openai':
          // OpenAI API 테스트
          const openaiResponse = await fetch(
            'https://api.openai.com/v1/models',
            {
              headers: {
                Authorization: `Bearer ${api_key}`,
              },
            }
          )
          if (openaiResponse.ok) {
            isValid = true
          } else {
            errorMessage = 'OpenAI API 키가 유효하지 않습니다.'
          }
          break

        default:
          return NextResponse.json(
            { error: '지원하지 않는 서비스입니다.' },
            { status: 400 }
          )
      }
    } catch (error: any) {
      isValid = false
      errorMessage = error.message || 'API 키 검증에 실패했습니다.'
    }

    return NextResponse.json({
      isValid,
      error: errorMessage || null,
      verifiedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || '검증 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
