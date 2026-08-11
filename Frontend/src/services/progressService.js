import api from './axios'
import { unwrap } from './apiUtils'

export async function getProgressOverview() {
  const data = unwrap(await api.get('/progress/dashboard'))
  return {
    ...data,
    totalInterviews: data.totalInterviews || data.interviewsCompleted || 0,
    avgScore: data.averageScore || 0,
    highestScore: data.highestScore || 0,
    resumeImprovement: data.resumeImprovementPercentage || 0,
    skillGrowth: data.skillGrowthPercentage || 0,
    streak: data.currentStreak || 0,
    completedModules: data.completedResources || 0,
    trend: data.scoreTrend || [],
    improvementTimeline: data.improvementTimeline || data.scoreTrend || [],
    skillBreakdown: data.skillBreakdown || [],
    voiceMetrics: data.voiceMetrics || {},
    videoMetrics: data.videoMetrics || {},
    aiFeedback: data.aiFeedback || {},
    careerSuggestions: data.careerSuggestions || [],
  }
}
