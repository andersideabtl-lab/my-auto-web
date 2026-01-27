/**
 * 안전한 JSON 파싱 유틸리티
 */

/**
 * AI 응답에서 JSON을 안전하게 추출하고 파싱
 * @param text 파싱할 텍스트
 * @param throwOnError 에러 발생 시 예외를 던질지 여부 (기본값: true)
 * @returns 파싱된 JSON 객체 또는 null (throwOnError가 false일 때)
 */
export function safeParseJSON(text: string, throwOnError: boolean = true): any {
  // 빈 문자열이나 null 체크
  if (!text || typeof text !== 'string') {
    if (throwOnError) {
      throw new Error('유효하지 않은 텍스트입니다.')
    }
    return null
  }

  let jsonText = text.trim()

  // 빈 문자열 체크
  if (jsonText === '') {
    if (throwOnError) {
      throw new Error('빈 문자열은 JSON으로 파싱할 수 없습니다.')
    }
    return null
  }

  // 코드 블록 제거
  if (jsonText.includes('```json')) {
    const parts = jsonText.split('```json')
    if (parts.length > 1) {
      jsonText = parts[1].split('```')[0].trim()
    }
  } else if (jsonText.includes('```')) {
    const parts = jsonText.split('```')
    if (parts.length > 1) {
      // 첫 번째 ``` 이후, 마지막 ``` 이전의 내용 추출
      jsonText = parts.slice(1, -1).join('```').trim()
    }
  }

  // JSON 시작/끝 찾기
  const firstBrace = jsonText.indexOf('{')
  const lastBrace = jsonText.lastIndexOf('}')
  const firstBracket = jsonText.indexOf('[')
  const lastBracket = jsonText.lastIndexOf(']')

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    jsonText = jsonText.substring(firstBrace, lastBrace + 1)
  } else if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    jsonText = jsonText.substring(firstBracket, lastBracket + 1)
  } else if (firstBrace === -1 && firstBracket === -1) {
    // JSON 구조가 전혀 없는 경우
    if (throwOnError) {
      throw new Error('JSON 구조를 찾을 수 없습니다.')
    }
    return null
  }

  // 불완전한 JSON 문자열 수정 시도
  try {
    return JSON.parse(jsonText)
  } catch (error: any) {
    // 마지막 시도: 불완전한 문자열 수정
    try {
      // 닫히지 않은 문자열 찾기 및 수정
      let fixedText = jsonText
      
      // 따옴표 균형 확인
      const singleQuotes = (fixedText.match(/'/g) || []).length
      const doubleQuotes = (fixedText.match(/"/g) || []).length
      
      // 홀수 개의 따옴표가 있으면 마지막에 추가
      if (doubleQuotes % 2 !== 0) {
        // 마지막 따옴표 찾기
        const lastQuoteIndex = fixedText.lastIndexOf('"')
        if (lastQuoteIndex !== -1) {
          // 마지막 따옴표 이후에 닫는 따옴표가 없으면 추가
          const afterLastQuote = fixedText.substring(lastQuoteIndex + 1)
          if (!afterLastQuote.includes('"')) {
            fixedText = fixedText + '"'
          }
        }
      }

      // 닫히지 않은 중괄호/대괄호 확인
      const openBraces = (fixedText.match(/{/g) || []).length
      const closeBraces = (fixedText.match(/}/g) || []).length
      const openBrackets = (fixedText.match(/\[/g) || []).length
      const closeBrackets = (fixedText.match(/\]/g) || []).length

      // 닫히지 않은 중괄호 추가
      if (openBraces > closeBraces) {
        fixedText = fixedText + '}'.repeat(openBraces - closeBraces)
      }
      
      // 닫히지 않은 대괄호 추가
      if (openBrackets > closeBrackets) {
        fixedText = fixedText + ']'.repeat(openBrackets - closeBrackets)
      }

      return JSON.parse(fixedText)
    } catch (secondError) {
      // throwOnError가 false면 null 반환, true면 에러 던지기
      if (!throwOnError) {
        return null
      }
      
      // 디버깅을 위한 로그 (개발 환경에서만)
      if (process.env.NODE_ENV === 'development') {
        console.error('JSON 파싱 실패:', {
          originalError: error.message,
          secondError: (secondError as Error).message,
          textLength: jsonText.length,
          preview: jsonText.substring(0, 200),
        })
      }
      throw new Error(`JSON 파싱에 실패했습니다: ${error.message}`)
    }
  }
}

/**
 * 스트리밍 응답에서 JSON 파싱
 */
export function parseStreamingJSON(chunk: string): any | null {
  try {
    // data: 접두사 제거
    if (chunk.startsWith('data: ')) {
      const dataStr = chunk.slice(6).trim()
      if (dataStr === '[DONE]' || dataStr === '') {
        return null
      }
      return JSON.parse(dataStr)
    }
    return JSON.parse(chunk)
  } catch (error) {
    // 스트리밍 중 불완전한 JSON은 무시
    return null
  }
}
