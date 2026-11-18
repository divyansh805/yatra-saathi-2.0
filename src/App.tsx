import React from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from 'motion/react';
import { AppProvider, useApp } from './contexts/AppContext';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { TravelAssistPage } from './features/travel-assist/TravelAssistPage';
import { CompareRidesPage } from './features/travel-assist/CompareRidesPage';
import { ExplorePlanPage } from './features/explore-plan/ExplorePlanPage';
import { DetailPage } from './features/explore-plan/DetailPage';
import { StayRealityPage } from './features/stay-reality/StayRealityPage';
import { StayDetailPage } from './features/stay-reality/StayDetailPage';
import { SmoothScrollManager } from './components/SmoothScrollManager';
import { DetailOverlayProvider } from './components/DetailOverlay';
import { DURATION_BASE, EASE_PRIMARY } from './motion/tokens';

function QuotaBanner() {
  const { mapsQuotaExceeded } = useApp();
  if (!mapsQuotaExceeded) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-sm text-center sticky top-0 z-50 shadow-sm">
      <span>
        Google Maps Platform quota reached. If you are the app owner, visit{' '}
        <a
          href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-semibold text-amber-950 hover:text-amber-800"
        >
          maps developer site
        </a>{' '}
        for instructions to update your account.
      </span>
    </div>
  );
}

function SessionSpinner() {
  return (
    <div className="min-h-screen bg-[#F8F6F0] flex flex-col items-center justify-center gap-3">
      <div className="w-9 h-9 border-2 border-[#123D3A] border-t-transparent rounded-full animate-spin" />
      <p className="text-sm font-medium text-[#495553]">Verifying your Yatra Saathi session...</p>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useApp();
  const location = useLocation();

  if (authLoading) return <SessionSpinner />;
  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }
  return <>{children}</>;
}

function PublicOnlyAuthRoute({ children }: { children: React.ReactNode }) {
  const { user, authLoading } = useApp();

  if (authLoading) return <SessionSpinner />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AnimatedAppRoutes() {
  const location = useLocation();
  const prefersReducedMotion = Boolean(useReducedMotion());

  return (
    <motion.div
      key={location.pathname}
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: prefersReducedMotion ? 0.14 : DURATION_BASE * 0.75,
        ease: EASE_PRIMARY,
      }}
    >
      <Routes location={location}>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <PublicOnlyAuthRoute>
              <AuthPage initialMode="login" />
            </PublicOnlyAuthRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyAuthRoute>
              <AuthPage initialMode="register" />
            </PublicOnlyAuthRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicOnlyAuthRoute>
              <AuthPage initialMode="forgot" />
            </PublicOnlyAuthRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/travel-assist"
          element={
            <ProtectedRoute>
              <TravelAssistPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/travel-assist/compare"
          element={
            <ProtectedRoute>
              <CompareRidesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/explore"
          element={
            <ProtectedRoute>
              <ExplorePlanPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/explore/:kind/:id"
          element={
            <ProtectedRoute>
              <DetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stay-reality"
          element={
            <ProtectedRoute>
              <StayRealityPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stay-reality/:id"
          element={
            <ProtectedRoute>
              <StayDetailPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </motion.div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AppProvider>
        <BrowserRouter>
          <DetailOverlayProvider>
            <SmoothScrollManager />
            <QuotaBanner />
            <AnimatedAppRoutes />
          </DetailOverlayProvider>
        </BrowserRouter>
      </AppProvider>
    </MotionConfig>
  );
}
