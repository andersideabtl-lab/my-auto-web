'use client'

import { useState, useEffect } from 'react'
import { ServicePreset, getPresetById } from '@/lib/service-presets'
import ServiceSelectModal from './ServiceSelectModal'

import { Credential } from '@/types/credential'

interface AddCredentialModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editingCredential?: Credential | null
}

export default function AddCredentialModal({
  isOpen,
  onClose,
  onSuccess,
  editingCredential = null,
}: AddCredentialModalProps) {
  const isEditMode = !!editingCredential
  const [selectedPreset, setSelectedPreset] = useState<ServicePreset | 'custom' | null>(null)
  const [isServiceSelectOpen, setIsServiceSelectOpen] = useState(false)
  const [serviceName, setServiceName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [managementUrl, setManagementUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  // Supabase 전용 필드
  const [supabaseUrl, setSupabaseUrl] = useState('')
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 수정 모드일 때 기존 데이터 로드
  useEffect(() => {
    if (editingCredential && isOpen) {
      const preset = editingCredential.service_name
        ? getPresetById(editingCredential.service_name)
        : null
      
      if (preset) {
        setSelectedPreset(preset)
        setServiceName(editingCredential.service_name || 'custom')
        setDisplayName(editingCredential.display_name || preset.name)
        setManagementUrl(editingCredential.management_url || preset.managementUrl)
        
        // Supabase인 경우 API 키 파싱
        if (preset.id === 'supabase' && editingCredential.api_key && editingCredential.api_key.includes('|')) {
          const parts = editingCredential.api_key.split('|')
          if (parts.length === 2) {
            setSupabaseUrl(parts[0].trim())
            setSupabaseAnonKey(parts[1].trim())
          }
        }
      } else {
        setSelectedPreset('custom')
        setServiceName('custom')
        setDisplayName(editingCredential.display_name || '')
        setManagementUrl(editingCredential.management_url || '')
      }
      // API 키는 마스킹된 값이므로 빈 값으로 시작
      setApiKey('')
      setSupabaseUrl('')
      setSupabaseAnonKey('')
    } else if (!editingCredential && isOpen) {
      // 추가 모드일 때 초기화
      setSelectedPreset(null)
      setServiceName('')
      setDisplayName('')
      setManagementUrl('')
      setApiKey('')
      setSupabaseUrl('')
      setSupabaseAnonKey('')
    }
  }, [editingCredential, isOpen])

  if (!isOpen) return null

  const handleServiceSelect = (preset: ServicePreset | 'custom') => {
    setSelectedPreset(preset)
    setIsServiceSelectOpen(false)
    
    if (preset === 'custom') {
      setServiceName('custom')
      setDisplayName('')
      setManagementUrl('')
      setApiKey('')
      setSupabaseUrl('')
      setSupabaseAnonKey('')
    } else {
      setServiceName(preset.id)
      setDisplayName(preset.name)
      setManagementUrl(preset.managementUrl)
      setApiKey('')
      setSupabaseUrl('')
      setSupabaseAnonKey('')
    }
  }

  const handleOpenServiceSelect = () => {
    setIsServiceSelectOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // Supabase인 경우 URL과 ANON_KEY 합치기
      let finalApiKey = apiKey.trim()
      if (selectedPreset !== 'custom' && selectedPreset && selectedPreset.id === 'supabase') {
        if (!supabaseUrl.trim() || !supabaseAnonKey.trim()) {
          setError('Supabase URL과 ANON_KEY를 모두 입력해주세요.')
          setLoading(false)
          return
        }
        finalApiKey = `${supabaseUrl.trim()}|${supabaseAnonKey.trim()}`
      }

      let response: Response
      
      if (isEditMode && editingCredential) {
        // 수정 모드
        response = await fetch(`/api/credentials/${editingCredential.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api_key: finalApiKey,
            // API 키만 업데이트하므로 다른 필드는 변경하지 않음
          }),
        })
      } else {
        // 추가 모드
        response = await fetch('/api/credentials', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            service: serviceName || 'custom',
            service_name: serviceName,
            display_name: displayName || (selectedPreset !== 'custom' && selectedPreset ? selectedPreset.name : ''),
            management_url: managementUrl || (selectedPreset !== 'custom' && selectedPreset ? selectedPreset.managementUrl : ''),
            api_key: finalApiKey,
            is_shared: true, // 항상 공유 키로 저장
          }),
        })
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || (isEditMode ? 'API 키 수정에 실패했습니다.' : 'API 키 저장에 실패했습니다.'))
      }

      // 초기화
      setApiKey('')
      setSupabaseUrl('')
      setSupabaseAnonKey('')
      setSelectedPreset(null)
      setServiceName('')
      setDisplayName('')
      setManagementUrl('')
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {isEditMode ? 'API 키 수정' : 'API 키 추가'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 서비스 선택 - 수정 모드에서는 비활성화 */}
            {!isEditMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  서비스
                </label>
                {!selectedPreset ? (
                <button
                  type="button"
                  onClick={handleOpenServiceSelect}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition text-center"
                >
                  <span className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    서비스 선택
                  </span>
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800">
                    {selectedPreset !== 'custom' && (
                      <>
                        <span className="text-2xl">{selectedPreset.icon}</span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {selectedPreset.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {selectedPreset.managementUrl}
                          </div>
                        </div>
                      </>
                    )}
                    {selectedPreset === 'custom' && (
                      <>
                        <span className="text-2xl">➕</span>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            커스텀 서비스
                          </div>
                        </div>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPreset(null)
                        setServiceName('')
                        setDisplayName('')
                        setManagementUrl('')
                      }}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {selectedPreset === 'custom' && (
                    <>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="서비스 이름"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white outline-none transition"
                      />
                      <input
                        type="url"
                        value={managementUrl}
                        onChange={(e) => setManagementUrl(e.target.value)}
                        placeholder="관리 URL (선택사항)"
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white outline-none transition"
                      />
                    </>
                  )}
                </div>
              )}
              </div>
            )}

            {isEditMode && editingCredential && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  서비스
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-3">
                    {editingCredential.service_name && getPresetById(editingCredential.service_name) ? (
                      <>
                        <span className="text-2xl">
                          {getPresetById(editingCredential.service_name)?.icon}
                        </span>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {editingCredential.display_name || getPresetById(editingCredential.service_name)?.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            서비스 정보는 변경할 수 없습니다
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-2xl">🔑</span>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {editingCredential.display_name || '커스텀 서비스'}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            서비스 정보는 변경할 수 없습니다
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 공유 설정 - 관리자만 */}
            {!isEditMode && (
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    팀 공유 API 키로 저장
                  </span>
                </label>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  모든 팀원이 사용할 수 있는 공유 키로 저장됩니다
                </p>
              </div>
            )}

            {/* Supabase인 경우 두 개의 필드로 분리 */}
            {selectedPreset !== 'custom' && selectedPreset && selectedPreset.id === 'supabase' ? (
              <>
                <div>
                  <label
                    htmlFor="supabaseUrl"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Supabase URL *
                  </label>
                  <input
                    id="supabaseUrl"
                    type="url"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    required={!isEditMode}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white outline-none transition font-mono text-sm"
                    placeholder="https://xxxxx.supabase.co"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Supabase 프로젝트 URL을 입력하세요
                  </p>
                </div>
                <div>
                  <label
                    htmlFor="supabaseAnonKey"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Supabase ANON KEY *
                  </label>
                  <input
                    id="supabaseAnonKey"
                    type="password"
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    required={!isEditMode}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white outline-none transition font-mono text-sm"
                    placeholder="your_anon_key"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Supabase ANON KEY (JWT 토큰)를 입력하세요
                  </p>
                </div>
              </>
            ) : (
              <div>
                <label
                  htmlFor="apiKey"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  API 키 *
                </label>
                <input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  required={!isEditMode}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-gray-700 dark:text-white outline-none transition font-mono text-sm"
                  placeholder={
                    isEditMode
                      ? '새로운 API 키를 입력하세요 (비워두면 변경하지 않음)'
                      : selectedPreset !== 'custom' && selectedPreset
                      ? selectedPreset.placeholder
                      : 'API 키를 입력하세요'
                  }
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {isEditMode
                    ? '새로운 API 키를 입력하면 자동으로 검증됩니다.'
                    : '저장 시 자동으로 검증됩니다.'}
                </p>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? isEditMode
                    ? '수정 중...'
                    : '저장 중...'
                  : isEditMode
                  ? '수정'
                  : '저장'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ServiceSelectModal
        isOpen={isServiceSelectOpen}
        onClose={() => setIsServiceSelectOpen(false)}
        onSelect={handleServiceSelect}
      />
    </div>
  )
}
