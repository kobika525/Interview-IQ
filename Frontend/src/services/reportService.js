import { INTERVIEW_HISTORY } from '../data/mockData'
import { INTERVIEW_QUESTIONS } from '../data/interviewQuestions'
import { delay } from '../utils/helpers'

export async function getReport(id) {
  await delay(500)
  const base = INTERVIEW_HISTORY.find((h) => h.id === id) || INTERVIEW_HISTORY[0]
  return {
    ...base,
    overall: base.score,
    technical: Math.max(base.score - 6, 40),
    communication: Math.min(base.score + 5, 98),
    relevance: Math.max(base.score - 3, 40),
    keywordCoverage: Math.max(base.score - 10, 35),
    grammar: Math.min(base.score + 8, 99),
    completeness: Math.min(base.score + 2, 99),
    speakingSpeed: base.mode === 'text' ? null : 142,
    fillerWords: base.mode === 'text' ? null : 7,
    pauseFrequency: base.mode === 'text' ? null : 'Moderate',
    speechClarity: base.mode === 'text' ? null : 84,
    faceVisibility: base.mode === 'video' ? 92 : null,
    cameraFacing: base.mode === 'video' ? 88 : null,
    recordingStability: base.mode === 'video' ? 'Stable' : null,
    strengths: ['Clear structure in answers', 'Confident delivery', 'Good use of specific examples'],
    weaknesses: ['Technical depth thin on system design', 'Rushed the closing summary'],
    suggestions: ['Review token bucket vs sliding-window rate limiting', 'Practice closing with a concise summary sentence'],
    questionBreakdown: INTERVIEW_QUESTIONS.slice(0, 4).map((q, i) => ({
      question: q.question,
      userAnswer:
        i === 0
          ? 'A controlled component gets its value from state and updates through onChange, while uncontrolled components manage their own value internally and are read via refs.'
          : 'I would use a token bucket approach with a shared store so limits stay consistent across servers.',
      score: [88, 74, 65, 80][i],
      feedback: i === 0 ? 'Clear and accurate — well explained.' : 'Good direction, but missing detail on distributed enforcement.',
      expectedKeywords: q.expectedKeywords,
      matchedKeywords: q.expectedKeywords.slice(0, 2),
      missingKeywords: q.expectedKeywords.slice(2),
      modelAnswer: q.modelAnswer,
      suggestion: 'Mention how the mechanism behaves under distributed load.',
    })),
  }
}
