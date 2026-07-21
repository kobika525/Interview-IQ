export const STORAGE_KEYS = { AUTH_TOKEN: 'interview_iq_token', AUTH_USER: 'interview_iq_user' }
export const FREE_RESUME_SCAN_LIMIT = 3
export const JOB_ROLES = ['Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'Software Engineer', 'Python Developer', 'Data Analyst', 'DevOps Engineer'].map((value) => ({ value, label: value }))
export const STUDY_LEVELS = ['Undergraduate', 'Final Year', 'Graduate', 'Postgraduate', 'Career Changer'].map((value) => ({ value, label: value }))
export const INTERVIEW_TYPES = ['Technical', 'Behavioural', 'HR', 'Mixed'].map((value) => ({ value, label: value }))
export const DIFFICULTY_LEVELS = ['Easy', 'Medium', 'Hard'].map((value) => ({ value, label: value }))
export const INTERVIEW_MODES = ['text', 'voice', 'video'].map((value) => ({ value, label: value[0].toUpperCase() + value.slice(1) }))
