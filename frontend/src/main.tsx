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
import { StorageProvider } from "./context/StorageContext";
import { ProtectedRoute, AuthenticatedLayout } from "@/components";
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
  // Public routes (no layout)
  { path: "/", element: <HomePage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  { path: "/forgot-password", element: <ForgotPasswordPage /> },
  { path: "/features", element: <FeaturesPage /> },
  { path: "/aboutus", element: <AboutUsPage /> },

  // Protected routes (shared layout with persistent Navbar)
  {
    element: (
      <ProtectedRoute>
        <AuthenticatedLayout />
      </ProtectedRoute>
    ),
    errorElement: <ErrorPage />,
    children: [
      { path: "/documents", element: <DocumentsPage /> },
      { path: "/summaries", element: <SummariesPage /> },
      { path: "/summaries/:id", element: <SummaryDetailPage /> },
      { path: "/study-spaces", element: <StudySpacesPage /> },
      { path: "/study-spaces/:id", element: <StudySpaceDetailPage /> },
      { path: "/stats", element: <StatsPage /> },
      { path: "/quizzes", element: <QuizzesPage /> },
      { path: "/quizzes/:id/attempt", element: <QuizAttemptPage /> },
      { path: "/quiz-attempts/:id/results", element: <QuizResultsPage /> },
      { path: "/profile", element: <ProfilePage /> },
      { path: "/settings", element: <SettingsPage /> },
    ],
  },

  { path: "*", element: <Navigate to="/" replace /> },
]);

const rootEl = document.getElementById("root");

if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <AuthProvider>
        <StorageProvider>
          <RouterProvider router={router} />
        </StorageProvider>
      </AuthProvider>
    </StrictMode>
  );
}
