import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

interface ProjectData {
  name: string
  overview: any
  conversationHistory?: any[]
  finalDecisions?: {
    completed: any[]
    deferred: any[]
    pending: any[]
  }
  validationResult?: any
}

export async function generateDesignPDF(projectData: ProjectData): Promise<Blob> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPosition = 20

  // 한글 폰트는 기본 폰트로 처리 (NotoSans 등은 별도 설정 필요)
  // 여기서는 기본 폰트 사용

  // 제목
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('프로젝트 설계서', pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 15

  // 프로젝트 정보
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('프로젝트 개요', 20, yPosition)
  yPosition += 10

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  const overview = projectData.overview

  if (overview) {
    doc.text(`프로젝트명: ${projectData.name}`, 20, yPosition)
    yPosition += 7

    if (overview.goal) {
      doc.text(`목표: ${overview.goal}`, 20, yPosition)
      yPosition += 7
    }

    if (overview.targetUsers) {
      doc.text(`주 사용자: ${overview.targetUsers}`, 20, yPosition)
      yPosition += 7
    }

    if (overview.summary) {
      doc.text(`요약: ${overview.summary}`, 20, yPosition)
      yPosition += 7
    }

    yPosition += 5
  }

  // 기술 스택
  if (overview?.techStack) {
    if (yPosition > pageHeight - 50) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('기술 스택', 20, yPosition)
    yPosition += 10

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    const techStack = overview.techStack
    if (typeof techStack === 'object') {
      Object.entries(techStack).forEach(([key, value]) => {
        doc.text(`${key}: ${value}`, 20, yPosition)
        yPosition += 7
      })
    } else {
      doc.text(`기술 스택: ${techStack}`, 20, yPosition)
      yPosition += 7
    }

    yPosition += 5
  }

  // 핵심 기능
  if (overview?.features && Array.isArray(overview.features)) {
    if (yPosition > pageHeight - 50) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('핵심 기능', 20, yPosition)
    yPosition += 10

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    overview.features.forEach((feature: string, index: number) => {
      doc.text(`${index + 1}. ${feature}`, 20, yPosition)
      yPosition += 7
    })

    yPosition += 5
  }

  // Phase 구조
  if (overview?.phases && Array.isArray(overview.phases)) {
    if (yPosition > pageHeight - 80) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Phase 구조', 20, yPosition)
    yPosition += 10

    const phaseData = overview.phases.map((phase: any) => [
      phase.name || '-',
      phase.duration || '-',
      Array.isArray(phase.features)
        ? phase.features.join(', ')
        : phase.features || '-',
    ])

    autoTable(doc, {
      startY: yPosition,
      head: [['Phase', '기간', '기능']],
      body: phaseData,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] },
    })

    yPosition = (doc as any).lastAutoTable.finalY + 10
  }

  // 최종 결정사항
  if (projectData.finalDecisions) {
    if (yPosition > pageHeight - 80) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('최종 결정사항', 20, yPosition)
    yPosition += 10

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')

    // 협의 완료 (초록)
    if (
      projectData.finalDecisions.completed &&
      projectData.finalDecisions.completed.length > 0
    ) {
      doc.setTextColor(0, 128, 0) // 초록색
      doc.setFont('helvetica', 'bold')
      doc.text('✓ 협의 완료', 20, yPosition)
      yPosition += 7

      doc.setTextColor(0, 0, 0) // 검정색
      doc.setFont('helvetica', 'normal')
      projectData.finalDecisions.completed.forEach((item: any) => {
        const text =
          typeof item === 'string' ? item : item.decision || JSON.stringify(item)
        doc.text(`  • ${text}`, 25, yPosition)
        yPosition += 7
      })
      yPosition += 3
    }

    // 협의 중 (노랑)
    if (
      projectData.finalDecisions.pending &&
      projectData.finalDecisions.pending.length > 0
    ) {
      doc.setTextColor(255, 165, 0) // 주황색
      doc.setFont('helvetica', 'bold')
      doc.text('⏳ 협의 중', 20, yPosition)
      yPosition += 7

      doc.setTextColor(0, 0, 0) // 검정색
      doc.setFont('helvetica', 'normal')
      projectData.finalDecisions.pending.forEach((item: any) => {
        const text =
          typeof item === 'string' ? item : item.decision || JSON.stringify(item)
        doc.text(`  • ${text}`, 25, yPosition)
        yPosition += 7
      })
      yPosition += 3
    }

    // 미뤄짐 (회색)
    if (
      projectData.finalDecisions.deferred &&
      projectData.finalDecisions.deferred.length > 0
    ) {
      doc.setTextColor(128, 128, 128) // 회색
      doc.setFont('helvetica', 'bold')
      doc.text('⏸ 미뤄짐', 20, yPosition)
      yPosition += 7

      doc.setTextColor(0, 0, 0) // 검정색
      doc.setFont('helvetica', 'normal')
      projectData.finalDecisions.deferred.forEach((item: any) => {
        const text =
          typeof item === 'string' ? item : item.decision || JSON.stringify(item)
        doc.text(`  • ${text}`, 25, yPosition)
        yPosition += 7
      })
    }
  }

  // 검증 결과
  if (projectData.validationResult) {
    if (yPosition > pageHeight - 50) {
      doc.addPage()
      yPosition = 20
    }

    doc.setTextColor(0, 0, 0) // 검정색
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('검증 결과', 20, yPosition)
    yPosition += 10

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.text(
      `종합 점수: ${projectData.validationResult.overallScore || 0}/100`,
      20,
      yPosition
    )
    yPosition += 7

    if (projectData.validationResult.issues?.length > 0) {
      doc.text(
        `발견된 문제: ${projectData.validationResult.issues.length}개`,
        20,
        yPosition
      )
      yPosition += 7
    }

    if (projectData.validationResult.strengths?.length > 0) {
      doc.text(
        `잘된 점: ${projectData.validationResult.strengths.length}개`,
        20,
        yPosition
      )
      yPosition += 7
    }
  }

  // 생성일
  doc.setFontSize(9)
  doc.setTextColor(128, 128, 128)
  doc.text(
    `생성일: ${new Date().toLocaleDateString('ko-KR')}`,
    pageWidth - 20,
    pageHeight - 10,
    { align: 'right' }
  )

  return doc.output('blob')
}

interface ReportData {
  projectName: string
  reportType: 'design' | 'phase' | 'audit'
  content: string
  overview?: any
  conversationHistory?: any[]
  finalDecisions?: any
  validationResult?: any
  phase?: any
}

export async function generateReportPDF(reportData: ReportData): Promise<Blob> {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPosition = 20

  // 리포트 제목
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  
  let title = ''
  if (reportData.reportType === 'design') {
    title = '설계 리포트'
  } else if (reportData.reportType === 'phase') {
    title = 'Phase 리포트'
  } else if (reportData.reportType === 'audit') {
    title = '감리 리포트'
  }
  
  doc.text(title, pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 10

  doc.setFontSize(12)
  doc.setFont('helvetica', 'normal')
  doc.text(`프로젝트: ${reportData.projectName}`, pageWidth / 2, yPosition, { align: 'center' })
  yPosition += 15

  // 리포트 내용 (마크다운을 간단히 텍스트로 변환)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  
  // 마크다운 내용을 줄 단위로 분리하여 출력
  const lines = reportData.content.split('\n')
  
  for (const line of lines) {
    if (yPosition > pageHeight - 30) {
      doc.addPage()
      yPosition = 20
    }

    // 마크다운 헤더 처리
    if (line.startsWith('# ')) {
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(line.substring(2), 20, yPosition)
      yPosition += 10
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
    } else if (line.startsWith('## ')) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(line.substring(3), 20, yPosition)
      yPosition += 8
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
    } else if (line.startsWith('### ')) {
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text(line.substring(4), 20, yPosition)
      yPosition += 7
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      doc.text(`  • ${line.substring(2)}`, 20, yPosition)
      yPosition += 7
    } else if (line.trim() === '') {
      yPosition += 3
    } else {
      // 긴 텍스트는 자동 줄바꿈
      const splitText = doc.splitTextToSize(line, pageWidth - 40)
      doc.text(splitText, 20, yPosition)
      yPosition += splitText.length * 7
    }
  }

  // 생성일
  doc.setFontSize(9)
  doc.setTextColor(128, 128, 128)
  doc.text(
    `생성일: ${new Date().toLocaleDateString('ko-KR')}`,
    pageWidth - 20,
    pageHeight - 10,
    { align: 'right' }
  )

  return doc.output('blob')
}
