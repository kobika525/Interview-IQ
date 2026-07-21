import { PROGRESS_TREND, INTERVIEW_HISTORY } from '../data/mockData'
import { delay } from '../utils/helpers'

export async function getProgressOverview() {
  await delay(500)
  const scores = INTERVIEW_HISTORY.map((h) => h.score)
  return {
    totalInterviews: INTERVIEW_HISTORY.length,
    avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    highestScore: Math.max(...scores),
    resumeImprovement: 22,
    skillGrowth: 18,
    streak: 5,
    completedModules: 6,
    trend: PROGRESS_TREND,
  }
}
