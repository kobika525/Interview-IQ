import api from './axios'
import { items, unwrap } from './apiUtils'

const RESOURCE_URLS = {
  'System Design Interview Fundamentals': 'https://www.educative.io/courses/grokking-modern-system-design-interview-for-engineers-managers',
  'AWS Developer Associate Prep': 'https://skillbuilder.aws/',
  'Docker & Kubernetes Crash Course': 'https://kubernetes.io/docs/tutorials/kubernetes-basics/',
  'Behavioral Interview Question Bank': '/app/interviews/setup',
  'REST API Design Best Practices': 'https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design',
  'SQL Practice: Joins & Indexing': 'https://sqlbolt.com/',
}

export async function getResources() {
  return items(await api.get('/resources')).map((resource) => ({
    ...resource,
    url: resource.url || RESOURCE_URLS[resource.title] || '',
    type: (resource.resourceType || '').toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()),
    duration: resource.estimatedDurationMinutes
      ? (resource.estimatedDurationMinutes >= 60 ? `${Math.round(resource.estimatedDurationMinutes / 60)}h` : `${resource.estimatedDurationMinutes}m`)
      : 'Self-paced',
    bookmarked: Boolean(resource.isBookmarked),
    completed: resource.progressStatus === 'COMPLETED',
  }))
}

export async function setResourceBookmarked(resourceId, bookmarked) {
  if (bookmarked) return unwrap(await api.post(`/resources/${resourceId}/bookmark`))
  await api.delete(`/resources/${resourceId}/bookmark`)
}

export async function completeResource(resourceId) {
  return unwrap(await api.post(`/resources/${resourceId}/complete`))
}

export async function getRoadmap() {
  const roadmaps = items(await api.get('/roadmaps'))
  const roadmap = roadmaps[0]
  if (!roadmap) {
    return { targetCareer: 'your target career', readiness: 0, estimatedDuration: 'Not generated', completion: 0, stages: [] }
  }
  const grouped = Object.values((roadmap.items || []).reduce((stages, item) => {
    const stageNumber = Math.max(1, Math.ceil((item.orderNumber || 1) / 4))
    stages[stageNumber] ||= {
      id: stageNumber,
      title: `Stage ${stageNumber}`,
      weekLabel: `Weeks ${(stageNumber - 1) * 2 + 1}-${stageNumber * 2}`,
      status: 'current',
      tasks: [],
    }
    stages[stageNumber].tasks.push({ id: item.id, title: item.title, done: item.isCompleted })
    return stages
  }, {}))
  return {
    id: roadmap.id,
    targetCareer: roadmap.title,
    readiness: Math.round(roadmap.completionPercentage || 0),
    estimatedDuration: `${roadmap.estimatedDurationWeeks} weeks`,
    completion: Math.round(roadmap.completionPercentage || 0),
    stages: grouped,
  }
}

export async function generateRoadmap(careerRoleId, skillGapAnalysisId) {
  return unwrap(await api.post('/roadmaps/generate', {
    career_role_id: careerRoleId,
    skill_gap_analysis_id: skillGapAnalysisId,
  }))
}

export async function setRoadmapItemCompleted(roadmapId, itemId, completed) {
  return unwrap(await api.post(`/roadmaps/${roadmapId}/items/${itemId}/${completed ? 'complete' : 'uncomplete'}`))
}
