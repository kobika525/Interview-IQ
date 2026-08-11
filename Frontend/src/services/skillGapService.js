import api from './axios'
import { items, unwrap } from './apiUtils'

export async function analyzeSkillGap(payload) {
  const roles = items(await api.get('/careers/roles', { params: { page_size: 100 } }))
  const role = roles.find((item) => item.id === Number(payload.careerRoleId))
    || roles.find((item) => item.title.toLowerCase() === payload.targetRole?.toLowerCase())
  if (!role) throw new Error('No career roles are available. Run the backend seed command first.')
  const result = unwrap(await api.post('/careers/skill-gap', {
    career_role_id: role.id,
    experience_level: payload.experience?.toLowerCase() || null,
    additional_skills: payload.skills || [],
    resume_id: payload.resumeId || null,
    education_level: payload.education || null,
    career_goals: payload.goals || null,
  }))
  const readiness = Math.round(result.readinessScore ?? 0)
  const breakdown = result.scoreBreakdown || {}
  const areas = [
    ['Required skills', breakdown.requiredSkills ?? readiness],
    ['Recommended skills', breakdown.recommendedSkills ?? readiness],
    ['Experience', breakdown.experience ?? readiness],
    ['Education', breakdown.education ?? readiness],
  ]
  return {
    ...result,
    targetRole: role.title,
    readiness,
    estimatedPrep: `${result.estimatedPrepWeeks ?? 0} weeks`,
    prioritySkills: result.priorityGaps || [],
    radar: areas.map(([skill, value]) => ({ skill, value: Math.round(value) })),
  }
}
