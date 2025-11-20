// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/home";
import Login from "./pages/login";
import SignUp from "./pages/signup";
import DocumentsPage from "./pages/documents";
import SummariesPage from "./pages/summaries";
import SummaryDetailPage from "./pages/SummaryDetail";
import QuizzesPage from "./pages/Quizzes";
import QuizAttemptPage from "./pages/QuizAttempt";
import QuizResultsPage from "./pages/QuizResults";
import ErrorPage from "./pages/ErrorPage";

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <SignUp /> },
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
