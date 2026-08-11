import api from './axios'
import { items, unwrap } from './apiUtils'

function normalizeAnalysis(analysis) {
  if (!analysis) return null
  return {
    ...analysis,
    atsScore: Math.round(analysis.overallScore ?? 0),
    skillsFound: (analysis.skillsFound || []).map((skill) => skill.name || skill),
    missingSkills: (analysis.missingSkills || []).map((skill) => skill.name || skill),
    sections: analysis.sectionsDetected || {},
  }
}

export async function getResumeHistory() {
  return items(await api.get('/resumes')).map((resume) => {
    const analysis = resume.latestAnalysis
    return {
      ...resume,
      name: resume.originalFilename || 'Untitled resume',
      uploadedAt: resume.createdAt,
      atsScore: Math.round(analysis?.overallScore ?? 0),
      skillsFound: (analysis?.skillsFound || []).map((skill) => skill.name || skill),
      missingSkills: (analysis?.missingSkills || []).map((skill) => skill.name || skill),
      status: resume.status || (analysis ? 'ANALYZED' : 'UPLOADED'),
      analysis: normalizeAnalysis(analysis),
    }
  })
}

export async function getResumeAnalysis(id) {
  return normalizeAnalysis(unwrap(await api.get(`/resumes/${id}/analysis`)))
}

export async function downloadResume(id, filename) {
  const response = await api.get(`/resumes/${id}/download`, { responseType: 'blob' })
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || 'resume'
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function analyzeResume(file, targetRoleId, onProgress) {
  const form = new FormData()
  form.append('file', file)
  if (targetRoleId) form.append('target_role_id', targetRoleId)
  const uploaded = unwrap(await api.post('/resumes', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: ({ loaded, total }) => onProgress?.(total ? Math.round((loaded / total) * 50) : 25),
  }))
  onProgress?.(60)
  const analysis = unwrap(await api.post(`/resumes/${uploaded.id}/analyze`))
  onProgress?.(100)
  return {
    ...normalizeAnalysis(analysis),
    id: uploaded.id,
    name: uploaded.originalFilename || file.name,
    uploadedAt: uploaded.createdAt,
  }
}

export async function deleteResume(id) {
  await api.delete(`/resumes/${id}`)
  return { success: true, id }
}
