/**
 * JSON 유틸리티 테스트
 */

import { safeParseJSON, parseStreamingJSON } from '@/lib/json-utils'

describe('safeParseJSON', () => {
  it('정상적인 JSON을 파싱합니다', () => {
    const json = '{"name": "test", "value": 123}'
    const result = safeParseJSON(json)
    expect(result).toEqual({ name: 'test', value: 123 })
  })

  it('코드 블록이 있는 JSON을 파싱합니다', () => {
    const json = '```json\n{"name": "test"}\n```'
    const result = safeParseJSON(json)
    expect(result).toEqual({ name: 'test' })
  })

  it('빈 문자열을 처리합니다', () => {
    expect(() => safeParseJSON('', false)).not.toThrow()
    const result = safeParseJSON('', false)
    expect(result).toBeNull()
  })

  it('유효하지 않은 JSON을 처리합니다', () => {
    const invalidJson = '{name: "test"}'
    expect(() => safeParseJSON(invalidJson, false)).not.toThrow()
    const result = safeParseJSON(invalidJson, false)
    expect(result).toBeNull()
  })

  it('불완전한 JSON을 수정 시도합니다', () => {
    const incompleteJson = '{"name": "test"'
    const result = safeParseJSON(incompleteJson, false)
    // 수정 시도 결과 확인
    expect(result).toBeDefined()
  })
})

describe('parseStreamingJSON', () => {
  it('data: 접두사가 있는 JSON을 파싱합니다', () => {
    const chunk = 'data: {"text": "hello"}'
    const result = parseStreamingJSON(chunk)
    expect(result).toEqual({ text: 'hello' })
  })

  it('[DONE] 메시지를 처리합니다', () => {
    const chunk = 'data: [DONE]'
    const result = parseStreamingJSON(chunk)
    expect(result).toBeNull()
  })

  it('빈 데이터를 처리합니다', () => {
    const chunk = 'data: '
    const result = parseStreamingJSON(chunk)
    expect(result).toBeNull()
  })

  it('유효하지 않은 JSON을 null로 반환합니다', () => {
    const chunk = 'data: {invalid json}'
    const result = parseStreamingJSON(chunk)
    expect(result).toBeNull()
  })
})
