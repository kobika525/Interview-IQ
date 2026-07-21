export const MOCK_USER = {
  id: 'u_1001',
  fullName: 'Jeyashankar Ravi',
  email: 'jeyashankar@email.com',
  phone: '+94 77 123 4567',
  avatar: null,
  role: 'user',
  degree: 'BSc (Hons) Computer Science',
  institute: 'University of Colombo',
  studyLevel: 'Final Year',
  targetCareer: 'Full Stack Developer',
  skills: ['JavaScript', 'React', 'Node.js', 'SQL', 'Git'],
  interests: ['Web Development', 'Cloud Computing'],
  bio: 'Final-year Computer Science student preparing for backend and full-stack engineering roles.',
  readinessScore: 78,
  createdAt: '2025-11-02',
  plan: 'free',
  planRenewsAt: null,
  usage: {
    resumeScansThisMonth: 2,
    interviewsThisMonth: 5,
  },
}

export const ADMIN_USER = {
  id: 'a_1',
  fullName: 'Interview IQ Admin',
  email: 'admin@interviewiq.app',
  role: 'admin',
  avatar: null,
}

export const RESUME_ANALYSES = [
  {
    id: 'r_301',
    name: 'Jeyashankar_Resume_Backend.pdf',
    uploadedAt: '2026-07-14',
    atsScore: 86,
    grammarScore: 88,
    formattingScore: 82,
    keywordScore: 79,
    skillsFound: ['Python', 'REST APIs', 'PostgreSQL', 'Docker', 'Git'],
    missingSkills: ['Kubernetes', 'System Design', 'AWS'],
    strengths: ['Clear quantified achievements', 'Consistent formatting', 'Strong project section'],
    weaknesses: ['Missing keywords for target role', 'Skills section could be reorganised by category'],
    sections: {
      contact: true,
      experience: true,
      education: true,
      skills: true,
      projects: true,
      summary: false,
    },
    suggestions: [
      'Add a professional summary highlighting your target role.',
      'Quantify impact in your experience bullets (e.g. "reduced latency by 30%").',
      'Add Kubernetes or cloud experience if you have any, even from coursework.',
    ],
    status: 'Completed',
  },
  {
    id: 'r_288',
    name: 'Jeyashankar_Resume_v2.pdf',
    uploadedAt: '2026-06-30',
    atsScore: 79,
    grammarScore: 81,
    formattingScore: 75,
    keywordScore: 70,
    skillsFound: ['Python', 'SQL', 'Git'],
    missingSkills: ['Docker', 'REST APIs', 'AWS', 'System Design'],
    strengths: ['Good academic section', 'Readable structure'],
    weaknesses: ['Thin on real-world project detail'],
    sections: { contact: true, experience: false, education: true, skills: true, projects: true, summary: false },
    suggestions: ['Add at least two detailed projects with measurable outcomes.'],
    status: 'Completed',
  },
  {
    id: 'r_255',
    name: 'Resume_Draft1.docx',
    uploadedAt: '2026-06-10',
    atsScore: 64,
    grammarScore: 70,
    formattingScore: 60,
    keywordScore: 58,
    skillsFound: ['SQL', 'Git'],
    missingSkills: ['Python', 'REST APIs', 'Docker'],
    strengths: ['Concise'],
    weaknesses: ['Missing measurable achievements', 'No dedicated skills section'],
    sections: { contact: true, experience: true, education: true, skills: false, projects: false, summary: false },
    suggestions: ['Add a skills section', 'Include at least one project'],
    status: 'Completed',
  },
]

export const SKILL_GAP_RESULT = {
  targetRole: 'Backend Developer',
  readiness: 74,
  matchedSkills: ['Python', 'SQL', 'Git', 'REST APIs'],
  missingSkills: ['Kubernetes', 'System Design', 'AWS'],
  beginnerSkills: ['Docker Basics'],
  intermediateSkills: ['System Design Fundamentals', 'Caching Strategies'],
  advancedSkills: ['Distributed Systems', 'Kubernetes at Scale'],
  prioritySkills: ['System Design', 'AWS'],
  estimatedPrep: '6 weeks @ 6 hrs/week',
  radar: [
    { skill: 'Coding', value: 85 },
    { skill: 'System Design', value: 45 },
    { skill: 'Databases', value: 78 },
    { skill: 'Cloud/DevOps', value: 38 },
    { skill: 'Communication', value: 72 },
    { skill: 'Problem Solving', value: 80 },
  ],
}

export const INTERVIEW_HISTORY = [
  { id: 'iv_501', role: 'Backend Developer', type: 'Technical', mode: 'video', difficulty: 'Hard', date: '2026-07-16', duration: '18:22', score: 82, status: 'Completed' },
  { id: 'iv_492', role: 'Full Stack Developer', type: 'Behavioural', mode: 'voice', difficulty: 'Medium', date: '2026-07-10', duration: '12:05', score: 71, status: 'Completed' },
  { id: 'iv_474', role: 'Backend Developer', type: 'Technical', mode: 'text', difficulty: 'Medium', date: '2026-06-28', duration: '20:41', score: 68, status: 'Completed' },
  { id: 'iv_460', role: 'Software Engineer', type: 'Mixed', mode: 'video', difficulty: 'Medium', date: '2026-06-18', duration: '16:10', score: 75, status: 'Completed' },
  { id: 'iv_441', role: 'Python Developer', type: 'HR', mode: 'text', difficulty: 'Easy', date: '2026-06-02', duration: '09:47', score: 88, status: 'Completed' },
]

export const PROGRESS_TREND = [
  { label: 'Wk1', overall: 52, technical: 48, communication: 55 },
  { label: 'Wk2', overall: 58, technical: 54, communication: 60 },
  { label: 'Wk3', overall: 55, technical: 52, communication: 58 },
  { label: 'Wk4', overall: 64, technical: 60, communication: 66 },
  { label: 'Wk5', overall: 69, technical: 65, communication: 70 },
  { label: 'Wk6', overall: 73, technical: 70, communication: 74 },
  { label: 'Wk7', overall: 76, technical: 73, communication: 78 },
  { label: 'Wk8', overall: 78, technical: 76, communication: 80 },
]

export const NOTIFICATIONS = [
  { id: 'n1', type: 'interview', title: 'Interview reminder', message: 'Your scheduled mock interview starts in 1 hour.', read: false, createdAt: '2026-07-18T08:00:00' },
  { id: 'n2', type: 'resume', title: 'Resume analysis completed', message: 'Your resume scored 86/100 — 5 points higher than last time.', read: false, createdAt: '2026-07-17T14:30:00' },
  { id: 'n3', type: 'resource', title: 'New recommendation', message: 'A new System Design course was added to your roadmap.', read: true, createdAt: '2026-07-16T10:00:00' },
  { id: 'n4', type: 'progress', title: 'Achievement unlocked', message: "You've completed 5 mock interviews this month.", read: true, createdAt: '2026-07-14T09:15:00' },
  { id: 'n5', type: 'system', title: 'Report generated', message: 'Your interview report for Backend Developer is ready.', read: true, createdAt: '2026-07-10T18:00:00' },
]

export const LEARNING_RESOURCES = [
  { id: 'res1', title: 'System Design Interview Fundamentals', skill: 'System Design', type: 'Course', difficulty: 'Intermediate', duration: '6h', provider: 'Grokking', description: 'Learn core system design patterns used in interviews: load balancing, caching, and data partitioning.', recommended: true, completed: false, bookmarked: true },
  { id: 'res2', title: 'AWS Developer Associate Prep', skill: 'AWS', type: 'Course', difficulty: 'Intermediate', duration: '10h', provider: 'A Cloud Guru', description: 'Hands-on preparation for the AWS Developer Associate certification.', recommended: true, completed: false, bookmarked: false },
  { id: 'res3', title: 'Docker & Kubernetes Crash Course', skill: 'Kubernetes', type: 'Video', difficulty: 'Beginner', duration: '3h', provider: 'YouTube', description: 'A practical introduction to containers and orchestration.', recommended: false, completed: true, bookmarked: false },
  { id: 'res4', title: 'Behavioral Interview Question Bank', skill: 'Communication', type: 'Interview Questions', difficulty: 'Beginner', duration: '1h', provider: 'Interview IQ', description: '50 common behavioural questions with model STAR answers.', recommended: true, completed: false, bookmarked: false },
  { id: 'res5', title: 'REST API Design Best Practices', skill: 'Backend', type: 'Article', difficulty: 'Intermediate', duration: '20m', provider: 'Interview IQ Blog', description: 'Guidelines for designing clean, versioned, predictable REST APIs.', recommended: false, completed: false, bookmarked: true },
  { id: 'res6', title: 'SQL Practice: Joins & Indexing', skill: 'Databases', type: 'Coding Exercise', difficulty: 'Intermediate', duration: '2h', provider: 'Interview IQ', description: 'Hands-on exercises covering joins, indexing, and query optimisation.', recommended: false, completed: false, bookmarked: false },
]

export const LEARNING_ROADMAP = {
  targetCareer: 'Backend Developer',
  readiness: 74,
  estimatedDuration: '6 weeks',
  completion: 42,
  stages: [
    {
      id: 's1', title: 'Foundations', status: 'completed', weekLabel: 'Week 1-2',
      tasks: [
        { id: 't1', title: 'Refresh Python fundamentals', done: true },
        { id: 't2', title: 'Practice SQL joins & indexing', done: true },
      ],
    },
    {
      id: 's2', title: 'System Design Basics', status: 'current', weekLabel: 'Week 3-4',
      tasks: [
        { id: 't3', title: 'Complete System Design Interview Fundamentals course', done: false },
        { id: 't4', title: 'Design a URL shortener (practice)', done: false },
      ],
    },
    {
      id: 's3', title: 'Cloud & Infrastructure', status: 'locked', weekLabel: 'Week 5',
      tasks: [
        { id: 't5', title: 'AWS Developer Associate prep', done: false },
        { id: 't6', title: 'Deploy a service with Docker', done: false },
      ],
    },
    {
      id: 's4', title: 'Interview Ready', status: 'locked', weekLabel: 'Week 6',
      tasks: [
        { id: 't7', title: 'Complete 3 mock video interviews', done: false },
        { id: 't8', title: 'Review weak topics from reports', done: false },
      ],
    },
  ],
}

export const ADMIN_STATS = {
  totalUsers: 4820,
  activeUsers: 1932,
  totalResumes: 6210,
  totalInterviews: 15430,
  avgInterviewScore: 74,
  totalResources: 312,
  userGrowth: [
    { month: 'Feb', users: 2100 }, { month: 'Mar', users: 2540 }, { month: 'Apr', users: 2990 },
    { month: 'May', users: 3480 }, { month: 'Jun', users: 4120 }, { month: 'Jul', users: 4820 },
  ],
  interviewActivity: [
    { day: 'Mon', interviews: 210 }, { day: 'Tue', interviews: 260 }, { day: 'Wed', interviews: 245 },
    { day: 'Thu', interviews: 300 }, { day: 'Fri', interviews: 280 }, { day: 'Sat', interviews: 150 }, { day: 'Sun', interviews: 120 },
  ],
  modeUsage: [
    { name: 'Text', value: 42 }, { name: 'Voice', value: 31 }, { name: 'Video', value: 27 },
  ],
  popularRoles: [
    { role: 'Full Stack Developer', count: 1420 }, { role: 'Backend Developer', count: 1110 },
    { role: 'Frontend Developer', count: 980 }, { role: 'Data Analyst', count: 640 }, { role: 'DevOps Engineer', count: 410 },
  ],
}

export const ADMIN_USERS = [
  { id: 'u1', name: 'Jeyashankar Ravi', email: 'jeyashankar@email.com', role: 'user', registeredAt: '2025-11-02', interviews: 14, status: 'Active' },
  { id: 'u2', name: 'Amara Fernando', email: 'amara.f@email.com', role: 'user', registeredAt: '2025-12-14', interviews: 9, status: 'Active' },
  { id: 'u3', name: 'Nadeesha Perera', email: 'nadeesha.p@email.com', role: 'user', registeredAt: '2026-01-20', interviews: 3, status: 'Inactive' },
  { id: 'u4', name: 'Kavindu Silva', email: 'kavindu.s@email.com', role: 'user', registeredAt: '2026-02-11', interviews: 21, status: 'Active' },
  { id: 'u5', name: 'Dilani Jayasuriya', email: 'dilani.j@email.com', role: 'user', registeredAt: '2026-03-05', interviews: 0, status: 'Suspended' },
]

export const ADMIN_QUESTIONS = [
  { id: 'aq1', question: 'Explain the difference between controlled and uncontrolled components in React.', role: 'Frontend Developer', type: 'Technical', topic: 'React', difficulty: 'Medium', status: 'Active' },
  { id: 'aq2', question: 'Walk me through how you would design a rate limiter for a public API.', role: 'Backend Developer', type: 'Technical', topic: 'System Design', difficulty: 'Hard', status: 'Active' },
  { id: 'aq3', question: 'Tell me about a time you disagreed with a teammate.', role: 'All Roles', type: 'HR', topic: 'Behavioral', difficulty: 'Easy', status: 'Active' },
  { id: 'aq4', question: 'What is database indexing and when would you avoid it?', role: 'Backend Developer', type: 'Technical', topic: 'Databases', difficulty: 'Medium', status: 'Draft' },
]

export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    tagline: 'Get started with the basics.',
    features: [
      '3 resume scans per month',
      'Text & voice mock interviews',
      'Basic career guidance',
      'Skill gap analysis',
      '1 saved report',
    ],
    limits: { resumeScans: 3, videoInterviews: false, reportHistory: 1 },
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 9,
    period: 'month',
    tagline: 'Full interview prep, unlocked.',
    highlight: true,
    features: [
      'Unlimited resume scans',
      'Text, voice & video mock interviews',
      'Advanced career guidance & comparisons',
      'Full interview report history',
      'Downloadable PDF reports',
      'Priority AI evaluation',
    ],
    limits: { resumeScans: Infinity, videoInterviews: true, reportHistory: Infinity },
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 19,
    period: 'month',
    tagline: 'For serious, fast-track preparation.',
    features: [
      'Everything in Premium',
      'Unlimited video interviews with detailed delivery analysis',
      'Personalised weekly coaching roadmap',
      'Early access to new interview modes',
      'Priority support',
    ],
    limits: { resumeScans: Infinity, videoInterviews: true, reportHistory: Infinity },
  },
]

export const INVOICES = [
  { id: 'inv_1003', date: '2026-07-01', plan: 'Premium', amount: 9, status: 'Paid' },
  { id: 'inv_1002', date: '2026-06-01', plan: 'Premium', amount: 9, status: 'Paid' },
  { id: 'inv_1001', date: '2026-05-01', plan: 'Premium', amount: 9, status: 'Paid' },
]

export const ADMIN_RESOURCES = [
  { id: 'ar1', name: 'System Design Interview Fundamentals', skill: 'System Design', type: 'Course', duration: '6h', difficulty: 'Intermediate', status: 'Published' },
  { id: 'ar2', name: 'AWS Developer Associate Prep', skill: 'AWS', type: 'Course', duration: '10h', difficulty: 'Intermediate', status: 'Published' },
  { id: 'ar3', name: 'Docker & Kubernetes Crash Course', skill: 'Kubernetes', type: 'Video', duration: '3h', difficulty: 'Beginner', status: 'Draft' },
]
