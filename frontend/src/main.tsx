// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import "./index.css";

// Si usas estas páginas en rutas SPA:
import Home from "./pages/home";
import Login from "./pages/login";
import SignUp from "./pages/signup";
import ErrorPage from "./pages/ErrorPage";

// NO tocamos #landing. Solo montamos si existe #root y si esta página fue diseñada para SPA.
const rootEl = document.getElementById("root");

// Puedes ajustar las rutas si usas SPA en otras páginas.
const router = createBrowserRouter([
  { path: "/", element: <Home />, errorElement: <ErrorPage /> },
  { path: "/login", element: <Login /> },
  { path: "/signup", element: <SignUp /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);

if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>
  );
}
