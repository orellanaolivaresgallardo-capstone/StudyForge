/**
 * Application route constants
 */

export const ROUTES = {
  // Public routes
  HOME: '/',
  FEATURES: '/features',
  ABOUT: '/about',

  // Auth routes
  LOGIN: '/login',
  SIGNUP: '/signup',
  FORGOT_PASSWORD: '/forgot-password',

  // Protected routes
  DASHBOARD: '/dashboard',
  DOCUMENTS: '/documents',
  SUMMARIES: '/summaries',
  SUMMARY_DETAIL: (id: string) => `/summaries/${id}`,
  QUIZZES: '/quizzes',
  QUIZ_ATTEMPT: (id: string) => `/quizzes/${id}/attempt`,
  QUIZ_RESULTS: (attemptId: string) => `/quiz-attempts/${attemptId}/results`,
  STUDY_SPACES: '/study-spaces',
  STUDY_SPACE_DETAIL: (id: string) => `/study-spaces/${id}`,
  STATS: '/stats',
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const;

/**
 * Check if route requires authentication
 */
export function isProtectedRoute(path: string): boolean {
  const protectedPaths = [
    '/dashboard',
    '/documents',
    '/summaries',
    '/quizzes',
    '/study-spaces',
    '/stats',
    '/profile',
    '/settings',
  ];

  return protectedPaths.some(protectedPath => path.startsWith(protectedPath));
}
