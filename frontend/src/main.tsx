import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Navigate, RouterProvider, createBrowserRouter } from "react-router-dom";

import "./index.css";

import AboutPage from "./pages/aboutus";
import ErrorPage from "./pages/ErrorPage";
import FeaturesPage from "./pages/features";
import ForgotPassword from "./pages/forgot-password";
import Home from "./pages/home";
import Login from "./pages/login";
import Results from "./pages/results";
import SignUp from "./pages/signup";
import UploadPage from "./pages/uploaddocuments";

const router = createBrowserRouter([
  { path: "/", element: <Home />, errorElement: <ErrorPage /> },
  { path: "/upload", element: <UploadPage />, errorElement: <ErrorPage /> },
  { path: "/results", element: <Results />, errorElement: <ErrorPage /> },
  { path: "/features", element: <FeaturesPage />, errorElement: <ErrorPage /> },
  { path: "/about", element: <AboutPage />, errorElement: <ErrorPage /> },
  { path: "/login", element: <Login />, errorElement: <ErrorPage /> },
  { path: "/signup", element: <SignUp />, errorElement: <ErrorPage /> },
  { path: "/forgot-password", element: <ForgotPassword />, errorElement: <ErrorPage /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);

const rootEl = document.getElementById("root");

if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
}
