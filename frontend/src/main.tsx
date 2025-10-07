import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import "./index.css";

import Home from "./pages/home";
import Login from "./pages/login";
import SignUp from "./pages/signup";
import ErrorPage from "./pages/ErrorPage";

// 👇 Oculta la landing estática para ver el SPA (temporal)
const landing = document.getElementById("landing");
if (landing) landing.style.display = "none";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
    errorElement: <ErrorPage />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <SignUp />,
  },
  // 👇 Cualquier otra ruta (incluido /index.html) redirige a /
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
