import { LEARNING_RESOURCES, LEARNING_ROADMAP } from '../data/mockData'
import { delay } from '../utils/helpers'

export async function getResources() {
  await delay(500)
  return LEARNING_RESOURCES
}

export async function getRoadmap() {
  await delay(500)
  return LEARNING_ROADMAP
}
