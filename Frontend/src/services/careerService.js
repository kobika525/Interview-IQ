import api from './axios'
import { items, unwrap } from './apiUtils'

function careerCard(match) {
  const role = match.careerRole || match
  return {
    id: match.id || role.id,
    roleId: role.id,
    title: role.title,
    summary: match.explanation || role.description || '',
    match: Math.round(match.matchScore ?? 0),
    matchedSkills: match.matchedSkills || [],
    missingSkills: match.missingSkills || role.requiredSkills || [],
    demand: role.demandLevel || 'Medium',
    duration: `${role.estimatedLearningDurationWeeks || 0} weeks`,
    difficulty: role.experienceLevel || 'Beginner',
    scoreBreakdown: match.scoreBreakdown || {},
    evidenceSources: match.evidenceSources || [],
  }
}

export async function getCareerRecommendations(profile = {}) {
  const response = await api.post('/careers/matches/generate', {
    preferred_industry: profile.industry || null,
    preferred_work_style: profile.workStyle || null,
    career_goals: profile.goals || profile.interests || null,
    current_skills: profile.skills || [],
    education_level: profile.education || null,
    interests: profile.interests || null,
    target_location: profile.location || null,
    experience_level: profile.experience || null,
  })
  return (unwrap(response) || []).map(careerCard)
}

export async function getMySkills() {
  return (unwrap(await api.get('/skills/me')) || []).map((item) => item.skill?.name).filter(Boolean)
}

export async function getSavedCareerMatches() {
  return items(await api.get('/careers/matches', { params: { page_size: 9 } })).map(careerCard)
}

export async function getCareerRoles() {
  return items(await api.get('/careers/roles', { params: { page_size: 100 } }))
}

export async function getCareerById(id) {
  return careerCard(unwrap(await api.get(`/careers/roles/${id}`)))
}
