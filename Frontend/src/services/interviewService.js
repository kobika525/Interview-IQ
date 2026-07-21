import { INTERVIEW_HISTORY } from '../data/mockData'
import { getRandomQuestions } from '../data/interviewQuestions'
import { delay, randomId } from '../utils/helpers'

export async function getInterviewHistory() {
  await delay(500)
  return INTERVIEW_HISTORY
}

export async function createInterviewSession(setup) {
  await delay(700)
  const questions = getRandomQuestions(5)
  return { id: randomId('iv'), setup, questions, createdAt: new Date().toISOString() }
}

export async function submitAnswer(sessionId, questionId, answer) {
  await delay(300)
  return { success: true, sessionId, questionId }
}

export async function submitInterview(sessionId) {
  await delay(2200)
  return { success: true, reportId: randomId('rep') }
}
