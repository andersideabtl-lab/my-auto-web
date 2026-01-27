'use client'

import { useState } from 'react'
import PDFViewer from './PDFViewer'

interface DocumentViewerProps {
  documentFiles: any[]
  onClose: () => void
}

export default function DocumentViewer({
  documentFiles,
  onClose,
}: DocumentViewerProps) {
  const [selectedFile, setSelectedFile] = useState<any>(
    documentFiles.length > 0 ? documentFiles[documentFiles.length - 1] : null
  )

  if (!selectedFile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">
            문서가 없습니다.
          </p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            닫기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* 문서 목록 */}
      {documentFiles.length > 1 && (
        <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2 overflow-x-auto">
            {documentFiles.map((file, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedFile(file)}
                className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition ${
                  selectedFile.name === file.name
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {file.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PDF 뷰어 */}
      <div className="flex-1">
        <PDFViewer
          url={selectedFile.url}
          fileName={selectedFile.name}
          onClose={onClose}
        />
      </div>
    </div>
  )
}
