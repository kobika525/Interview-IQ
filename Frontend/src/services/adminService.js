import api from './axios'
import { items, toSnakeCase, unwrap } from './apiUtils'

export async function getAdminStats() {
  const data = unwrap(await api.get('/admin/dashboard'))
  return {
    ...data,
    totalUsers: data.totalUsers || 0,
    activeUsers: data.activeUsers || 0,
    totalResumes: data.resumeAnalyses || 0,
    totalInterviews: data.completedInterviews || 0,
    avgInterviewScore: data.averageInterviewScore || 0,
    totalResources: data.totalResources || 0,
    activeSubscriptions: data.activeSubscriptions || 0,
    modeUsage: Object.entries(data.interviewModeDistribution || {}).map(([name, value]) => ({ name, value })),
    popularRoles: data.popularCareerRoles || [],
    userGrowth: data.userGrowth || [],
    interviewActivity: data.interviewActivity || [],
  }
}

export async function getAdminUsers() {
  return items(await api.get('/admin/users')).map((user) => ({
    ...user,
    name: user.fullName || '',
    status: formatAccountStatus(user.accountStatus),
    registeredAt: user.createdAt,
    interviews: user.interviews || 0,
  }))
}

function formatAccountStatus(status) {
  return {
    ACTIVE: 'Active', SUSPENDED: 'Suspended', DISABLED: 'Inactive',
    PENDING_VERIFICATION: 'Pending verification',
  }[status] || status || 'Inactive'
}

export async function updateAdminUserStatus(id, accountStatus) {
  const user = unwrap(await api.patch(`/admin/users/${id}/status`, { account_status: accountStatus }))
  return {
    ...user,
    name: user.fullName || '',
    status: formatAccountStatus(user.accountStatus),
    registeredAt: user.createdAt,
    interviews: user.interviews || 0,
  }
}

export async function updateAdminUser(id, payload) {
  const user = unwrap(await api.patch(`/admin/users/${id}`, toSnakeCase(payload)))
  return {
    ...user,
    name: user.fullName || '',
    status: formatAccountStatus(user.accountStatus),
    registeredAt: user.createdAt,
    interviews: user.interviews || 0,
  }
}

export async function deleteAdminUser(id) {
  await api.delete(`/admin/users/${id}`)
}

export async function getAdminQuestions() {
  return items(await api.get('/admin/questions')).map(normalizeAdminQuestion)
}

function normalizeAdminQuestion(question) {
  return {
    ...question,
    question: question.questionText || '',
    role: question.careerRoleId ? `Role #${question.careerRoleId}` : question.category || 'All Roles',
    type: question.interviewType || '',
    status: question.isActive ? 'Active' : 'Draft',
    modelAnswer: question.sampleAnswer || '',
  }
}

export async function createAdminQuestion(payload) {
  return normalizeAdminQuestion(unwrap(await api.post('/admin/questions', toSnakeCase(payload))))
}

export async function updateAdminQuestion(id, payload) {
  return normalizeAdminQuestion(unwrap(await api.patch(`/admin/questions/${id}`, toSnakeCase(payload))))
}

export async function deleteAdminQuestion(id) {
  await api.delete(`/admin/questions/${id}`)
}

export async function getAdminResources() {
  return items(await api.get('/admin/resources')).map(normalizeAdminResource)
}

function normalizeAdminResource(resource) {
  return {
    ...resource,
    name: resource.title || '',
    skill: resource.skillName || '',
    type: formatResourceType(resource.resourceType),
    difficulty: resource.difficulty
      ? `${resource.difficulty.charAt(0)}${resource.difficulty.slice(1).toLowerCase()}`
      : '',
    duration: resource.estimatedDurationMinutes
      ? `${resource.estimatedDurationMinutes} min`
      : '',
    status: resource.isPublished ? 'Published' : 'Draft',
  }
}

function formatResourceType(type) {
  return {
    COURSE: 'Course', ARTICLE: 'Article', VIDEO: 'Video', DOCUMENTATION: 'Documentation',
    EXERCISE: 'Coding Exercise', INTERVIEW_QUESTIONS: 'Interview Questions', CERTIFICATION: 'Certification',
  }[type] || type || ''
}

function resourcePayload(resource) {
  const minutes = Number.parseInt(String(resource.duration || ''), 10)
  return {
    title: resource.name,
    skillName: resource.skill || null,
    resourceType: {
      Course: 'COURSE', Article: 'ARTICLE', Video: 'VIDEO', Documentation: 'DOCUMENTATION',
      'Coding Exercise': 'EXERCISE', 'Interview Questions': 'INTERVIEW_QUESTIONS', Certification: 'CERTIFICATION',
    }[resource.type] || resource.type,
    difficulty: String(resource.difficulty || 'Beginner').toUpperCase(),
    url: resource.url || null,
    description: resource.description || null,
    estimatedDurationMinutes: Number.isFinite(minutes) ? minutes : 60,
  }
}

export async function createAdminResource(resource) {
  const payload = { ...resourcePayload(resource), isPublished: false }
  return normalizeAdminResource(unwrap(await api.post('/admin/resources', toSnakeCase(payload))))
}

export async function updateAdminResource(id, resource) {
  return normalizeAdminResource(unwrap(await api.patch(`/admin/resources/${id}`, toSnakeCase(resourcePayload(resource)))))
}

export async function setAdminResourcePublished(id, isPublished) {
  return normalizeAdminResource(unwrap(await api.patch(`/admin/resources/${id}`, { is_published: isPublished })))
}

export async function deleteAdminResource(id) {
  await api.delete(`/admin/resources/${id}`)
}

export async function getAdminSubscriptions() {
  return items(await api.get('/admin/subscriptions'))
}

export async function getAdminPlans() {
  return unwrap(await api.get('/admin/subscription-plans')) || []
}

export async function getAdminInterviewReports() {
  return items(await api.get('/admin/reports/interviews'))
}

export async function getAdminCareerRoles() {
  return items(await api.get('/admin/career-roles'))
}

export async function createAdminCareerRole(payload) {
  return unwrap(await api.post('/admin/career-roles', payload))
}

export async function updateAdminCareerRole(id, payload) {
  return unwrap(await api.patch(`/admin/career-roles/${id}`, payload))
}

export async function deleteAdminCareerRole(id) {
  await api.delete(`/admin/career-roles/${id}`)
}
