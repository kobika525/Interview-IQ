import api from './axios'
import { items, unwrap } from './apiUtils'

function normalizeSession(session) {
  return {
    ...session,
    type: session.interviewType,
    score: session.overallScore ?? 0,
    role: session.targetRole || 'Mock Interview',
    date: session.completedAt || session.createdAt,
    visualPresentationScore: session.visualPresentationScore,
    questions: (session.questions || []).map((question) => ({
      ...question,
      question: question.questionText,
      type: question.interviewType,
    })),
  }
}

export async function getInterviewSession(sessionId) {
  return normalizeSession(unwrap(await api.get(`/interviews/${sessionId}`)))
}

export async function getInterviewHistory() {
  return items(await api.get('/interviews')).map(normalizeSession)
}

export async function createInterviewSession(setup) {
  const roles = items(await api.get('/careers/roles', { params: { page_size: 100 } }))
  const role = roles.find((item) => item.title === setup.role)
  const difficultyMap = { easy: 'BEGINNER', medium: 'INTERMEDIATE', hard: 'ADVANCED' }
  const typeMap = {
    technical: 'TECHNICAL',
    hr: 'HR',
    behavioural: 'BEHAVIORAL',
    behavioral: 'BEHAVIORAL',
    situational: 'BEHAVIORAL',
    mixed: 'MIXED',
  }
  const session = unwrap(await api.post('/interviews', {
    target_role_id: role?.id || null,
    interview_type: typeMap[(setup.type || 'mixed').toLowerCase()] || 'MIXED',
    mode: (setup.mode || 'text').toUpperCase(),
    experience_level: difficultyMap[(setup.difficulty || '').toLowerCase()] || 'BEGINNER',
    difficulty: difficultyMap[(setup.difficulty || '').toLowerCase()] || 'BEGINNER',
    question_count: 5,
    question_categories: setup.topics || [],
  }))
  await api.post(`/interviews/${session.id}/start`)
  return normalizeSession(session)
}

export async function submitAnswer(sessionId, questionOrder, answer) {
  return unwrap(await api.post(`/interviews/${sessionId}/answers/text`, {
    question_order: questionOrder,
    answer_text: answer,
  }))
}

export async function submitVideoAnswer(sessionId, questionOrder, blob, transcript = '') {
  const form = new FormData()
  const extension = blob.type.includes('mp4') ? 'mp4' : 'webm'
  form.append('file', blob, `answer-${questionOrder}.${extension}`)
  if (transcript.trim()) form.append('transcript', transcript.trim())
  return unwrap(await api.post(`/interviews/${sessionId}/answers/video`, form, {
    params: { question_order: questionOrder },
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 180000,
  }))
}

export async function submitAudioAnswer(sessionId, questionOrder, blob, transcript = '') {
  const form = new FormData()
  form.append('file', blob, `answer-${questionOrder}.webm`)
  if (transcript.trim()) form.append('transcript', transcript.trim())
  return unwrap(await api.post(`/interviews/${sessionId}/answers/audio`, form, {
    params: { question_order: questionOrder },
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 180000,
  }))
}

export async function submitInterview(sessionId) {
  const data = unwrap(await api.post(`/interviews/${sessionId}/complete`))
  return { success: true, reportId: data.reportId, overallScore: data.overallScore }
}
