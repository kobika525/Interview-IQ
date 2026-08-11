import api from './axios'
import { toSnakeCase, unwrap } from './apiUtils'

export async function getProfile() {
  return unwrap(await api.get('/users/me/profile'))
}

export async function updateProfile(payload) {
  return unwrap(await api.patch('/users/me/profile', toSnakeCase(payload)))
}

export async function uploadProfileImage(file) {
  const form = new FormData()
  form.append('file', file)
  return unwrap(await api.post('/users/me/profile-image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }))
}

export async function getProfileImage() {
  const response = await api.get('/users/me/profile-image', { responseType: 'blob' })
  return URL.createObjectURL(response.data)
}

export async function deleteProfileImage() {
  return unwrap(await api.delete('/users/me/profile-image'))
}
