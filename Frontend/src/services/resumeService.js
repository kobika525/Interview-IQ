import { RESUME_ANALYSES } from '../data/mockData'
import { delay, randomId } from '../utils/helpers'

export async function getResumeHistory() {
  await delay(500)
  return RESUME_ANALYSES
}

export async function analyzeResume(file, onProgress) {
  for (let p = 0; p <= 100; p += 20) {
    await delay(180)
    onProgress?.(p)
  }
  await delay(500)
  return { ...RESUME_ANALYSES[0], id: randomId('r'), name: file?.name || 'resume.pdf', uploadedAt: new Date().toISOString() }
}

export async function deleteResume(id) {
  await delay(400)
  return { success: true, id }
}
