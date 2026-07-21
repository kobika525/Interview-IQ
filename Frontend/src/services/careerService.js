import { CAREERS } from '../data/careerData'
import { delay } from '../utils/helpers'

export async function getCareerRecommendations(profile) {
  await delay(900)
  return CAREERS
}

export async function getCareerById(id) {
  await delay(300)
  return CAREERS.find((c) => c.id === id)
}
