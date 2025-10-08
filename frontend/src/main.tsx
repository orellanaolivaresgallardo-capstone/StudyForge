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

/**
 * ✅ Opción A:
 * - En el INDEX ("/" o "/index.html") NO tocamos la landing ni montamos el SPA.
 * - En cualquier otra ruta, ocultamos la landing y montamos React Router.
 *
 * Resultado:
 *  - Usuario nuevo: entra a "/", ve la landing (botones a login/signup).
 *  - Usuario en /login o /signup: SPA montado normalmente.
 *  - Si estando en SPA navega a "/", verá el <Home /> del SPA (no la landing), lo cual es OK.
 */
const onIndex =
  location.pathname === "/" || location.pathname.endsWith("/index.html");

if (!onIndex) {
  // 👇 Oculta la landing estática solo fuera del index
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
    // 👇 Cualquier otra ruta redirige a "/"
    {
      path: "*",
      element: <Navigate to="/" replace />,
    },
  ]);

  const rootEl = document.getElementById("root");
  if (rootEl) {
    createRoot(rootEl).render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>
    );
  }
} else {
  // En el index (landing) NO montamos SPA ni ocultamos la landing.
  // Si quisieras algún script mínimo para la landing, colócalo aquí.
}
