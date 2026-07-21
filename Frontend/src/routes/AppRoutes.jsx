import { Routes, Route, Navigate } from 'react-router-dom'

import PublicLayout from '../layouts/PublicLayout'
import AuthLayout from '../layouts/AuthLayout'
import AppLayout from '../layouts/AppLayout'
import AdminLayout from '../layouts/AdminLayout'

import ProtectedRoute from './ProtectedRoute'
import GuestRoute from './GuestRoute'
import AdminRoute from './AdminRoute'
import PremiumRoute from './PremiumRoute'

import Landing from '../pages/public/Landing'
import About from '../pages/public/About'
import Features from '../pages/public/Features'
import Pricing from '../pages/public/Pricing'
import Contact from '../pages/public/Contact'
import FAQ from '../pages/public/FAQ'
import Privacy from '../pages/public/Privacy'
import Terms from '../pages/public/Terms'
import NotFound from '../pages/public/NotFound'

import Login from '../pages/auth/Login'
import Register from '../pages/auth/Register'
import ForgotPassword from '../pages/auth/ForgotPassword'
import ResetPassword from '../pages/auth/ResetPassword'
import VerifyEmail from '../pages/auth/VerifyEmail'
import VerifyEmailSuccess from '../pages/auth/VerifyEmailSuccess'

import Onboarding from '../pages/onboarding/Onboarding'

import Dashboard from '../pages/dashboard/Dashboard'
import ResumeAnalyzer from '../pages/resume/ResumeAnalyzer'
import ResumeHistory from '../pages/resume/ResumeHistory'
import CareerGuidance from '../pages/career/CareerGuidance'
import SkillGapAnalysis from '../pages/skillGap/SkillGapAnalysis'
import InterviewHome from '../pages/interviews/InterviewHome'
import InterviewSetup from '../pages/interviews/InterviewSetup'
import TextInterview from '../pages/interviews/TextInterview'
import VoiceInterview from '../pages/interviews/VoiceInterview'
import VideoInterview from '../pages/interviews/VideoInterview'
import EvaluationLoading from '../pages/interviews/EvaluationLoading'
import InterviewHistory from '../pages/interviews/InterviewHistory'
import InterviewReport from '../pages/reports/InterviewReport'
import LearningRoadmap from '../pages/roadmap/LearningRoadmap'
import LearningResources from '../pages/resources/LearningResources'
import Progress from '../pages/progress/Progress'
import Notifications from '../pages/notifications/Notifications'
import Profile from '../pages/profile/Profile'
import Settings from '../pages/settings/Settings'
import Subscription from '../pages/subscription/Subscription'
import Billing from '../pages/billing/Billing'
import Checkout from '../pages/billing/Checkout'
import Support from '../pages/support/Support'

import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminUsers from '../pages/admin/AdminUsers'
import AdminQuestions from '../pages/admin/AdminQuestions'
import AdminCareerRoles from '../pages/admin/AdminCareerRoles'
import AdminResources from '../pages/admin/AdminResources'
import AdminSubscriptions from '../pages/admin/AdminSubscriptions'
import AdminInterviews from '../pages/admin/AdminInterviews'
import AdminReports from '../pages/admin/AdminReports'
import AdminAnalytics from '../pages/admin/AdminAnalytics'
import AdminSettings from '../pages/admin/AdminSettings'

import Forbidden from '../pages/system/Forbidden'
import ServerError from '../pages/system/ServerError'
import Offline from '../pages/system/Offline'
import Maintenance from '../pages/system/Maintenance'

export default function AppRoutes() {
  return (
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
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/verify-email-success" element={<VerifyEmailSuccess />} />
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
        <Route element={<PremiumRoute />}>
          <Route path="/app/interviews/video/:id" element={<VideoInterview />} />
        </Route>
      </Route>

      {/* Main user application */}
      <Route element={<ProtectedRoute />}>
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
  )
}
