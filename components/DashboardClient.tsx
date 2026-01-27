'use client'

import { useState } from 'react'
import QuickActions from './QuickActions'
import CreateProjectModal from './CreateProjectModal'

export default function DashboardClient() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <QuickActions onNewProject={() => setIsModalOpen(true)} />
      <CreateProjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          window.location.reload()
        }}
      />
    </>
  )
}
