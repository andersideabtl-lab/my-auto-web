'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DesignBot from './DesignBot'
import ExecuteBot from './ExecuteBot'
import SuperviseBot from './SuperviseBot'
import AnalysisTab from './AnalysisTab'
import AuditRunner from './AuditRunner'

interface ProjectTabsProps {
  projectId: string
  activeSection: 'analysis' | 'design' | 'execute' | 'supervise' | 'audit'
  initialOverview?: any
  creationMode?: 'new' | 'doc' | 'resume'
  uploadedFilePath?: string
}

export default function ProjectTabs({ 
  projectId, 
  activeSection: initialSection, 
  initialOverview,
  creationMode,
  uploadedFilePath,
}: ProjectTabsProps) {
  const [activeSection, setActiveSection] = useState(initialSection)
  const [projectOverview, setProjectOverview] = useState<any>(initialOverview || null)
  const router = useRouter()

  useEffect(() => {
    if (initialOverview) {
      setProjectOverview(initialOverview)
    }
  }, [initialOverview])

  const handleSectionChange = (section: string) => {
    setActiveSection(section as any)
    router.push(`/project/${projectId}?section=${section}`, { scroll: false })
  }

  const tabs = [
    ...(creationMode === 'doc' || creationMode === 'resume' ? [{
      id: 'analysis' as const,
      name: '분석',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    }] : []),
    {
      id: 'design' as const,
      name: '설계',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      id: 'execute' as const,
      name: '실행',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: 'audit' as const,
      name: '감리',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
  ]

  const handleDesignComplete = (overview: any) => {
    setProjectOverview(overview)
  }

  return (
    <div className="flex flex-col h-full">
      {/* 탭 헤더 */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleSectionChange(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition ${
                activeSection === tab.id
                  ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
        {activeSection === 'analysis' && (
          <AnalysisTab
            projectId={projectId}
            creationMode={creationMode}
            uploadedFilePath={uploadedFilePath}
          />
        )}
        {activeSection === 'design' && (
          <DesignBot projectId={projectId} onComplete={handleDesignComplete} />
        )}
        {activeSection === 'execute' && (
          <ExecuteBot projectId={projectId} projectOverview={projectOverview} />
        )}
        {activeSection === 'audit' && (
          <AuditRunner projectId={projectId} />
        )}
      </div>
    </div>
  )
}
