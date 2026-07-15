import { createBrowserRouter } from "react-router-dom";

import { Layout } from "@/widgets/Layout";

import { ProtectedRoute } from "@/features/auth";

export const router = createBrowserRouter([
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Layout />,
        children: [
          {
            path: "/",
            lazy: async () => ({
              Component: (await import("@/pages/DashboardPage")).default,
            }),
          },
          {
            path: "/users",
            lazy: async () => ({
              Component: (await import("@/pages/UsersPage")).default,
            }),
          },
          {
            path: "/projects",
            lazy: async () => ({
              Component: (await import("@/pages/ProjectsPage")).default,
            }),
          },
          {
            path: "/projects/:id",
            lazy: async () => ({
              Component: (await import("@/pages/ProjectDetailPage")).default,
            }),
          },
          {
            path: "/profile",
            lazy: async () => ({
              Component: (await import("@/pages/ProfilePage")).default,
            }),
          },
        ],
      },
    ],
  },
  {
    path: "/login",
    lazy: async () => ({
      Component: (await import("@/pages/LoginPage")).default,
    }),
  },
]);
