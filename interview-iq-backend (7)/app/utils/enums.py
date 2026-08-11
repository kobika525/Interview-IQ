import enum


class UserRole(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"


class AccountStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    SUSPENDED = "SUSPENDED"
    DISABLED = "DISABLED"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"


class ExperienceLevel(str, enum.Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"


class InterviewMode(str, enum.Enum):
    TEXT = "TEXT"
    VOICE = "VOICE"
    VIDEO = "VIDEO"


class InterviewType(str, enum.Enum):
    HR = "HR"
    BEHAVIORAL = "BEHAVIORAL"
    TECHNICAL = "TECHNICAL"
    MIXED = "MIXED"


class Difficulty(str, enum.Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"


class InterviewStatus(str, enum.Enum):
    CREATED = "CREATED"
    READY = "READY"
    IN_PROGRESS = "IN_PROGRESS"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    FAILED = "FAILED"


class ResumeStatus(str, enum.Enum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class RoadmapStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"


class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    CANCELLED = "CANCELLED"
    EXPIRED = "EXPIRED"
    PENDING = "PENDING"


class NotificationType(str, enum.Enum):
    INTERVIEW = "INTERVIEW"
    RESUME = "RESUME"
    LEARNING = "LEARNING"
    SUBSCRIPTION = "SUBSCRIPTION"
    SYSTEM = "SYSTEM"


class SkillCategory(str, enum.Enum):
    TECHNICAL = "TECHNICAL"
    SOFT = "SOFT"
    TOOL = "TOOL"
    FRAMEWORK = "FRAMEWORK"
    LANGUAGE = "LANGUAGE"
    DATABASE = "DATABASE"
    CLOUD_DEVOPS = "CLOUD_DEVOPS"


class SkillSource(str, enum.Enum):
    MANUAL = "MANUAL"
    RESUME = "RESUME"
    ONBOARDING = "ONBOARDING"


class PlanCode(str, enum.Enum):
    FREE = "FREE"
    BASIC = "BASIC"
    PRO = "PRO"
    # Kept so existing Premium subscriptions remain readable during migration.
    PREMIUM = "PREMIUM"


class ResourceType(str, enum.Enum):
    COURSE = "COURSE"
    ARTICLE = "ARTICLE"
    VIDEO = "VIDEO"
    DOCUMENTATION = "DOCUMENTATION"
    EXERCISE = "EXERCISE"
    INTERVIEW_QUESTIONS = "INTERVIEW_QUESTIONS"
    CERTIFICATION = "CERTIFICATION"


class ResourceProgressStatus(str, enum.Enum):
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class RoadmapItemType(str, enum.Enum):
    COURSE = "COURSE"
    PROJECT = "PROJECT"
    READING = "READING"
    PRACTICE = "PRACTICE"
    CERTIFICATION = "CERTIFICATION"
    INTERVIEW_CHECKPOINT = "INTERVIEW_CHECKPOINT"


class QuestionSource(str, enum.Enum):
    ADMIN = "ADMIN"
    TEMPLATE = "TEMPLATE"
    RESUME_BASED = "RESUME_BASED"
    JD_BASED = "JD_BASED"
    LLM = "LLM"


class TicketCategory(str, enum.Enum):
    TECHNICAL = "TECHNICAL"
    BILLING = "BILLING"
    RESUME = "RESUME"
    INTERVIEW = "INTERVIEW"
    BUG = "BUG"
    FEATURE = "FEATURE"
    OTHER = "OTHER"


class TicketStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CLOSED = "CLOSED"


class MessageSender(str, enum.Enum):
    USER = "USER"
    ADMIN = "ADMIN"


class InvoiceStatus(str, enum.Enum):
    PAID = "PAID"
    PENDING = "PENDING"
    FAILED = "FAILED"


class JobStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class JobType(str, enum.Enum):
    RESUME_ANALYSIS = "RESUME_ANALYSIS"
    VOICE_TRANSCRIPTION = "VOICE_TRANSCRIPTION"
    VIDEO_ANALYSIS = "VIDEO_ANALYSIS"
    REPORT_GENERATION = "REPORT_GENERATION"
    PDF_EXPORT = "PDF_EXPORT"
