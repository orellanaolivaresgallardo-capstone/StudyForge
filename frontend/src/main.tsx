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
import Login from "./pages/login";
import SignUp from "./pages/signup";
import DocumentsPage from "./pages/documents";
import ErrorPage from "./pages/ErrorPage";

const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/documents" replace /> },
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
