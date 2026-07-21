import { SKILL_GAP_RESULT } from '../data/mockData'
import { delay } from '../utils/helpers'

export async function analyzeSkillGap(payload) {
  await delay(900)
  return { ...SKILL_GAP_RESULT, targetRole: payload?.targetRole || SKILL_GAP_RESULT.targetRole }
}
