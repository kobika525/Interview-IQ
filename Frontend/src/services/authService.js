const unavailable = () => Promise.reject(new Error('Authentication service is not connected yet.'))

export const login = unavailable
export const register = unavailable
export const logout = async () => {}
