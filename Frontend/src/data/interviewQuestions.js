export const INTERVIEW_QUESTIONS = [
  {
    id: 'q1',
    topic: 'React',
    type: 'Technical',
    difficulty: 'Medium',
    question: 'Explain the difference between controlled and uncontrolled components in React.',
    expectedKeywords: ['state', 'value prop', 'DOM', 'onChange', 'ref'],
    modelAnswer:
      'A controlled component derives its value from React state and updates via an onChange handler, giving React full control over the input. An uncontrolled component manages its own state internally in the DOM and is accessed via a ref when needed.',
  },
  {
    id: 'q2',
    topic: 'System Design',
    type: 'Technical',
    difficulty: 'Hard',
    question: 'Walk me through how you would design a rate limiter for a public API.',
    expectedKeywords: ['token bucket', 'sliding window', 'Redis', 'throttling', 'distributed'],
    modelAnswer:
      'A rate limiter can be implemented with a token bucket or sliding-window algorithm, backed by a fast shared store like Redis so limits are enforced consistently across distributed API instances, with clear 429 responses and retry-after headers.',
  },
  {
    id: 'q3',
    topic: 'Behavioral',
    type: 'HR',
    difficulty: 'Easy',
    question: 'Tell me about a time you disagreed with a teammate. How did you handle it?',
    expectedKeywords: ['communication', 'compromise', 'listened', 'resolution'],
    modelAnswer:
      'Describe the specific disagreement, how you listened to the other perspective, the compromise or decision reached, and what you learned about communicating under disagreement — structured using the STAR method.',
  },
  {
    id: 'q4',
    topic: 'Databases',
    type: 'Technical',
    difficulty: 'Medium',
    question: 'What is database indexing and when would you avoid adding an index?',
    expectedKeywords: ['B-tree', 'query performance', 'write overhead', 'storage'],
    modelAnswer:
      'Indexes speed up read queries by avoiding full table scans, typically via B-tree structures, but add overhead on writes and consume storage — so they should be avoided on low-cardinality columns or tables with heavy write load.',
  },
  {
    id: 'q5',
    topic: 'Situational',
    type: 'Situational',
    difficulty: 'Medium',
    question: 'A production deployment just broke a critical feature. What do you do first?',
    expectedKeywords: ['rollback', 'monitoring', 'communicate', 'root cause'],
    modelAnswer:
      'First stabilize by rolling back or disabling the feature, communicate status to stakeholders, then investigate logs and monitoring to find the root cause before re-deploying with a fix and a post-mortem.',
  },
  {
    id: 'q6',
    topic: 'JavaScript',
    type: 'Technical',
    difficulty: 'Easy',
    question: 'What is the difference between == and === in JavaScript?',
    expectedKeywords: ['type coercion', 'strict equality', 'loose equality'],
    modelAnswer:
      '== performs type coercion before comparing values, while === compares both value and type without coercion, which is why strict equality is generally preferred to avoid unexpected bugs.',
  },
]

export function getRandomQuestions(count = 5) {
  const shuffled = [...INTERVIEW_QUESTIONS].sort(() => Math.random() - 0.5)
  const pool = shuffled.length >= count ? shuffled : [...shuffled, ...shuffled, ...shuffled]
  return pool.slice(0, count)
}
