// frontend/src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "@/components";
import HomePage from "./pages/public/HomePage";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import FeaturesPage from "./pages/public/FeaturesPage";
import AboutUsPage from "./pages/public/AboutUsPage";
import DocumentsPage from "./pages/documents/DocumentsPage";
import SummariesPage from "./pages/summaries/SummariesPage";
import SummaryDetailPage from "./pages/summaries/SummaryDetailPage";
import StudySpacesPage from "./pages/study-spaces/StudySpacesPage";
import StudySpaceDetailPage from "./pages/study-spaces/StudySpaceDetailPage";
import QuizzesPage from "./pages/quizzes/QuizzesPage";
import QuizAttemptPage from "./pages/quizzes/QuizAttemptPage";
import QuizResultsPage from "./pages/quizzes/QuizResultsPage";
import StatsPage from "./pages/stats/StatsPage";
import ProfilePage from "./pages/profile/ProfilePage";
import SettingsPage from "./pages/settings/SettingsPage";
import ErrorPage from "./pages/ErrorPage";

const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/features", element: <FeaturesPage /> },
  { path: "/aboutus", element: <AboutUsPage /> },
  {
    path: "/documents",
    element: (
      <ProtectedRoute>
        <DocumentsPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/summaries",
    element: (
      <ProtectedRoute>
        <SummariesPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/summaries/:id",
    element: (
      <ProtectedRoute>
        <SummaryDetailPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/study-spaces",
    element: (
      <ProtectedRoute>
        <StudySpacesPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/study-spaces/:id",
    element: (
      <ProtectedRoute>
        <StudySpaceDetailPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/stats",
    element: (
      <ProtectedRoute>
        <StatsPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/quizzes",
    element: (
      <ProtectedRoute>
        <QuizzesPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/quizzes/:id/attempt",
    element: (
      <ProtectedRoute>
        <QuizAttemptPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/quiz-attempts/:id/results",
    element: (
      <ProtectedRoute>
        <QuizResultsPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  {
    path: "/settings",
    element: (
      <ProtectedRoute>
        <SettingsPage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

const rootEl = document.getElementById("root");

if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </StrictMode>
  );
}
