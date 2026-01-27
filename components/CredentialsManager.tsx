'use client'

import { useState, useEffect } from 'react'
import { Credential, SERVICE_LINKS, SERVICE_NAMES } from '@/types/credential'
import CredentialCard from './CredentialCard'
import AddCredentialModal from './AddCredentialModal'

export default function CredentialsManager() {
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCredential, setEditingCredential] = useState<Credential | null>(null)

  const fetchCredentials = async () => {
    try {
      const response = await fetch('/api/credentials')
      if (!response.ok) {
        throw new Error('API 키 목록을 불러오는데 실패했습니다.')
      }
      const data = await response.json()
      setCredentials(data)
    } catch (error) {
      console.error('Error fetching credentials:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCredentials()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('정말 이 API 키를 삭제하시겠습니까?')) {
      return
    }

    try {
      const response = await fetch(`/api/credentials/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('API 키 삭제에 실패했습니다.')
      }

      setCredentials(credentials.filter((c) => c.id !== id))
    } catch (error: any) {
      alert(error.message || '삭제에 실패했습니다.')
    }
  }

  const handleVerify = async (id: string) => {
    try {
      // 재검증 API 호출
      const response = await fetch(`/api/credentials/${id}/verify`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('검증에 실패했습니다.')
      }

      // 목록 새로고침
      fetchCredentials()
    } catch (error: any) {
      alert(error.message || '검증에 실패했습니다.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          저장된 API 키
        </h2>
        <button
          onClick={() => {
            setEditingCredential(null)
            setIsModalOpen(true)
          }}
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition shadow-sm hover:shadow-md"
        >
          <span className="flex items-center gap-2">
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
            API 키 추가
          </span>
        </button>
      </div>

      {credentials.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border border-gray-200 dark:border-gray-700">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            저장된 API 키가 없습니다
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            API 키를 추가하여 외부 서비스를 사용하세요
          </p>
          <button
            onClick={() => {
              setEditingCredential(null)
              setIsModalOpen(true)
            }}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition"
          >
            첫 API 키 추가하기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {credentials.map((credential) => (
            <CredentialCard
              key={credential.id}
              credential={credential}
              onDelete={handleDelete}
              onVerify={handleVerify}
              onEdit={(credential) => {
                setEditingCredential(credential)
                setIsModalOpen(true)
              }}
            />
          ))}
        </div>
      )}

      <AddCredentialModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingCredential(null)
        }}
        onSuccess={() => {
          fetchCredentials()
          setEditingCredential(null)
        }}
        editingCredential={editingCredential}
      />
    </>
  )
}
