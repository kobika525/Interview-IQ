import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import PublicLayout from '../layouts/PublicLayout'
import AuthLayout from '../layouts/AuthLayout'
import AppLayout from '../layouts/AppLayout'
import AdminLayout from '../layouts/AdminLayout'

import ProtectedRoute from './ProtectedRoute'
import GuestRoute from './GuestRoute'
import AdminRoute from './AdminRoute'

const pageModules = import.meta.glob('../pages/**/*.jsx')
const page = (path) => lazy(pageModules[`${path}.jsx`])
const Landing = page('../pages/public/Landing')
const About = page('../pages/public/About')
const Features = page('../pages/public/Features')
const Pricing = page('../pages/public/Pricing')
const Contact = page('../pages/public/Contact')
const FAQ = page('../pages/public/FAQ')
const Privacy = page('../pages/public/Privacy')
const Terms = page('../pages/public/Terms')
const NotFound = page('../pages/public/NotFound')
const Login = page('../pages/auth/Login')
const Register = page('../pages/auth/Register')
const ForgotPassword = page('../pages/auth/ForgotPassword')
const ResetPassword = page('../pages/auth/ResetPassword')
const Onboarding = page('../pages/onboarding/Onboarding')
const Dashboard = page('../pages/dashboard/Dashboard')
const ResumeAnalyzer = page('../pages/resume/ResumeAnalyzer')
const ResumeHistory = page('../pages/resume/ResumeHistory')
const CareerGuidance = page('../pages/career/CareerGuidance')
const SkillGapAnalysis = page('../pages/skillGap/SkillGapAnalysis')
const InterviewHome = page('../pages/interviews/InterviewHome')
const InterviewSetup = page('../pages/interviews/InterviewSetup')
const TextInterview = page('../pages/interviews/TextInterview')
const VoiceInterview = page('../pages/interviews/VoiceInterview')
const VideoInterview = page('../pages/interviews/VideoInterview')
const EvaluationLoading = page('../pages/interviews/EvaluationLoading')
const InterviewHistory = page('../pages/interviews/InterviewHistory')
const InterviewReport = page('../pages/reports/InterviewReport')
const LearningRoadmap = page('../pages/roadmap/LearningRoadmap')
const LearningResources = page('../pages/resources/LearningResources')
const Progress = page('../pages/progress/Progress')
const Notifications = page('../pages/notifications/Notifications')
const Profile = page('../pages/profile/Profile')
const Settings = page('../pages/settings/Settings')
const Subscription = page('../pages/subscription/Subscription')
const Billing = page('../pages/billing/Billing')
const Checkout = page('../pages/billing/Checkout')
const Support = page('../pages/support/Support')
const AdminDashboard = page('../pages/admin/AdminDashboard')
const AdminUsers = page('../pages/admin/AdminUsers')
const AdminQuestions = page('../pages/admin/AdminQuestions')
const AdminCareerRoles = page('../pages/admin/AdminCareerRoles')
const AdminResources = page('../pages/admin/AdminResources')
const AdminSubscriptions = page('../pages/admin/AdminSubscriptions')
const AdminInterviews = page('../pages/admin/AdminInterviews')
const AdminReports = page('../pages/admin/AdminReports')
const AdminAnalytics = page('../pages/admin/AdminAnalytics')
const AdminSettings = page('../pages/admin/AdminSettings')
const Forbidden = page('../pages/system/Forbidden')
const ServerError = page('../pages/system/ServerError')
const Offline = page('../pages/system/Offline')
const Maintenance = page('../pages/system/Maintenance')

export default function AppRoutes() {
  return (
    <Suspense fallback={<div className="min-h-screen grid place-items-center text-text-muted">Loading…</div>}>
    <Routes>
      {/* Public website */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/features" element={<Features />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
      </Route>

      {/* Authentication (redirect away if already logged in) */}
      <Route element={<GuestRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>
      </Route>

      {/* Onboarding — logged in, full-screen, no app chrome */}
      <Route element={<ProtectedRoute />}>
        <Route path="/onboarding" element={<Onboarding />} />
      </Route>

      {/* Focused, full-screen interview experience — logged in, no sidebar/topbar */}
      <Route element={<ProtectedRoute />}>
        <Route path="/app/interviews/text/:id" element={<TextInterview />} />
        <Route path="/app/interviews/voice/:id" element={<VoiceInterview />} />
        <Route path="/app/interviews/processing/:id" element={<EvaluationLoading />} />
        <Route path="/app/interviews/video/:id" element={<VideoInterview />} />
      </Route>

      {/* Main user application */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
        <Route element={<AppLayout />}>
          <Route path="/app/dashboard" element={<Dashboard />} />
          <Route path="/app/resume-analyzer" element={<ResumeAnalyzer />} />
          <Route path="/app/resume-history" element={<ResumeHistory />} />
          <Route path="/app/career-guidance" element={<CareerGuidance />} />
          <Route path="/app/skill-gap-analysis" element={<SkillGapAnalysis />} />
          <Route path="/app/interviews" element={<InterviewHome />} />
          <Route path="/app/interviews/setup" element={<InterviewSetup />} />
          <Route path="/app/interviews/history" element={<InterviewHistory />} />
          <Route path="/app/interviews/report/:id" element={<InterviewReport />} />
          <Route path="/app/learning-roadmap" element={<LearningRoadmap />} />
          <Route path="/app/resources" element={<LearningResources />} />
          <Route path="/app/progress" element={<Progress />} />
          <Route path="/app/notifications" element={<Notifications />} />
          <Route path="/app/profile" element={<Profile />} />
          <Route path="/app/settings" element={<Settings />} />
          <Route path="/app/subscription" element={<Subscription />} />
          <Route path="/app/billing" element={<Billing />} />
          <Route path="/app/checkout" element={<Checkout />} />
          <Route path="/app/support" element={<Support />} />
        </Route>
      </Route>

      {/* Admin application */}
      <Route element={<AdminRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/questions" element={<AdminQuestions />} />
          <Route path="/admin/career-roles" element={<AdminCareerRoles />} />
          <Route path="/admin/resources" element={<AdminResources />} />
          <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
          <Route path="/admin/interviews" element={<AdminInterviews />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/analytics" element={<AdminAnalytics />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>
      </Route>

      {/* System pages */}
      <Route path="/403" element={<Forbidden />} />
      <Route path="/404" element={<NotFound />} />
      <Route path="/500" element={<ServerError />} />
      <Route path="/offline" element={<Offline />} />
      <Route path="/maintenance" element={<Maintenance />} />
      <Route path="*" element={<Navigate to="/404" replace />} />
    </Routes>
    </Suspense>
  )
}
