'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'

interface SidebarProps {
  projectId: string
  activeSection?: 'design' | 'execute' | 'supervise' | 'documents'
  documentFiles?: any[]
  onDocumentClick?: (file: any) => void
}

export default function Sidebar({
  projectId,
  activeSection = 'design',
  documentFiles = [],
  onDocumentClick,
}: SidebarProps) {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['design', 'execute', 'supervise', 'documents'])
  )

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId)
    } else {
      newExpanded.add(sectionId)
    }
    setExpandedSections(newExpanded)
  }

  const sections = [
    {
      id: 'design',
      name: '설계',
      icon: '📋',
      subsections: ['설계봇'],
    },
    {
      id: 'execute',
      name: '실행',
      icon: '🔨',
      subsections: ['Phase 목록'],
    },
    {
      id: 'supervise',
      name: '감리',
      icon: '🔍',
      subsections: ['코드 감리'],
    },
    {
      id: 'documents',
      name: '문서',
      icon: '📚',
      subsections: [],
    },
  ]

  return (
    <div className="fixed left-0 top-0 h-full w-[250px] bg-gray-800 dark:bg-gray-900 border-r border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-gray-300 hover:text-white transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          <span className="text-sm font-medium">대시보드</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.id)
          const isActive = activeSection === section.id

          return (
            <div key={section.id}>
              <button
                onClick={() => toggleSection(section.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{section.icon}</span>
                  <span className="font-medium">{section.name}</span>
                </div>
                <svg
                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isExpanded && (
                <div className="ml-4 mt-1 space-y-1">
                  {section.id === 'documents' ? (
                    documentFiles.length > 0 ? (
                      documentFiles.map((file, idx) => (
                        <Link
                          key={idx}
                          href={`/project/${projectId}?section=documents&file=${idx}`}
                          className="w-full text-left px-4 py-2 rounded-lg text-sm transition text-gray-400 hover:bg-gray-700 hover:text-gray-200"
                        >
                          <div className="flex items-center gap-2">
                            <span>📄</span>
                            <div className="flex-1 min-w-0">
                              <p className="truncate">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(file.createdAt).toLocaleDateString(
                                  'ko-KR'
                                )}
                              </p>
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <p className="px-4 py-2 text-sm text-gray-500">
                        문서가 없습니다
                      </p>
                    )
                  ) : (
                    section.subsections.map((subsection) => (
                      <Link
                        key={subsection}
                        href={`/project/${projectId}?section=${section.id}`}
                        className={`block px-4 py-2 rounded-lg text-sm transition ${
                          isActive
                            ? 'bg-indigo-700 text-white'
                            : 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                        }`}
                      >
                        {subsection}
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    </div>
  )
}
