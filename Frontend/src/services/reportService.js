import api from './axios'
import { unwrap } from './apiUtils'

export async function getReport(sessionId) {
  const report = unwrap(await api.get(`/reports/interviews/${sessionId}`))
  if (!report) throw new Error('This interview report is not available yet.')
  const questionBreakdown = (report.questionBreakdown || []).map((item) => ({
    ...item,
    suggestion: item.improvementSuggestion,
  }))
  return {
    ...report,
    overall: report.overallScore,
    technical: report.technicalScore,
    communication: report.communicationScore,
    relevance: report.relevanceScore,
    grammar: report.grammarScore ?? report.structureScore,
    structure: report.structureScore,
    completeness: report.problemSolvingScore,
    recordingDurationSeconds: report.recordingDurationSeconds,
    speakingWpm: report.speakingWpm,
    speakingSpeed: report.speakingSpeed,
    averagePauseSeconds: report.averagePauseSeconds,
    longestPauseSeconds: report.longestPauseSeconds,
    longPauseCount: report.longPauseCount,
    fillerWords: report.fillerWordCount,
    voiceConfidence: report.voiceConfidenceScore,
    voiceQuality: report.voiceQualityScore,
    voiceFluency: report.voiceFluencyScore,
    pronunciationQuality: report.pronunciationQualityScore,
    speechClarity: report.speechClarityScore,
    faceVisibility: report.faceVisibilityPercentage,
    cameraFacing: report.forwardFacingPercentage,
    eyeContact: report.eyeContactPercentage,
    faceDetection: report.faceDetectionPercentage,
    headPosition: report.headPositionScore,
    lookingAway: report.lookingAwayPercentage,
    smileDetection: report.smilePercentage,
    cameraStability: report.cameraStabilityScore,
    lightingQuality: report.lightingQualityScore,
    bodyLanguageConfidence: report.bodyLanguageConfidenceScore,
    videoConfidence: report.videoConfidenceScore,
    recordingStabilityNote: report.recordingStabilityNote,
    visualMetrics: report.visualMetrics || null,
    improvedAnswers: report.improvedAnswers || [],
    aiSuggestions: report.aiSuggestions || report.interviewTips || [],
    careerGuidance: report.careerGuidance || report.careerAdvice || [],
    hiringRecommendation: report.hiringRecommendation,
    weaknesses: report.growthAreas || [],
    suggestions: report.aiSuggestions || report.interviewTips || [],
    careerAdvice: report.careerGuidance || report.careerAdvice || [],
    learningResources: report.suggestedLearningResources || [],
    questionBreakdown,
    role: report.role || 'Mock Interview',
    type: report.type || 'Interview',
    mode: report.mode || 'Text',
    difficulty: report.difficulty || 'Adaptive',
    date: report.createdAt,
    duration: report.duration || 'Completed',
  }
}

export async function downloadInterviewReport(reportId) {
  const response = await api.get(`/reports/${reportId}/pdf`, {
    responseType: 'blob',
    timeout: 60000,
  })

  const contentType = response.headers['content-type'] || response.data?.type || ''
  if (!response.data || response.data.size === 0) {
    throw new Error('The server returned an empty PDF report.')
  }
  if (!contentType.toLowerCase().includes('application/pdf')) {
    let message = 'The server did not return a valid PDF report.'
    try {
      const payload = JSON.parse(await response.data.text())
      message = payload.message || payload.detail || message
    } catch {
      // Keep the fallback when the response is not JSON.
    }
    throw new Error(message)
  }

  const disposition = response.headers['content-disposition'] || ''
  const encodedFilename = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1]
  const plainFilename = disposition.match(/filename="?([^";]+)"?/i)?.[1]
  const filename = encodedFilename
    ? decodeURIComponent(encodedFilename)
    : plainFilename || `interview_report_${reportId}.pdf`

  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
