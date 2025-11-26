// frontend/src/services/api.ts
/**
 * Cliente API para StudyForge con autenticación JWT.
 * Usa axios para todas las peticiones HTTP.
 */
import axios, { AxiosInstance, AxiosError } from "axios";
import type {
  // Auth
  UserCreate,
  UserLogin,
  Token,
  UserDetailResponse,
  // Documents
  DocumentResponse,
  DocumentDetailResponse,
  DocumentListResponse,
  DocumentUpdateTitle,
  StorageInfo,
  // Summaries
  SummaryResponse,
  SummaryDetailResponse,
  SummaryListResponse,
  SummaryCreateFromDocuments,
  ExpertiseLevel,
  // Quizzes
  QuizResponse,
  QuizListResponse,
  QuizCreateFromSummary,
  // Study Spaces
  StudySpaceCreate,
  StudySpaceUpdate,
  StudySpaceResponse,
  StudySpaceDetailResponse,
  StudySpaceListResponse,
  AddResourceRequest,
  StudySpaceStatsResponse,
  // Quiz Attempts
  QuizAttemptResponse,
  QuizAttemptWithQuestionsResponse,
  QuizAttemptCreate,
  QuizAttemptAnswer,
  QuizAttemptAnswerFeedback,
  QuizResultResponse,
  // Stats
  UserProgress,
  UserPerformance,
  StatsSummary,
  // Health
  HealthResponse,
} from "@/types";

// ==================== CONFIGURACIÓN ====================

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE as string | undefined) ||
  "http://localhost:8000";

const TOKEN_STORAGE_KEY = "sf_token";

// ==================== AXIOS INSTANCE ====================

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar token JWT a todas las peticiones
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejo de errores 401 (token expirado)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token inválido o expirado, limpiar y redirigir a login
      clearToken();
      // Solo redirigir si no estamos ya en login/signup
      if (
        !window.location.pathname.includes("/login") &&
        !window.location.pathname.includes("/signup")
      ) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ==================== TOKEN MANAGEMENT ====================

export function getToken(): string | null {
  return (
    localStorage.getItem(TOKEN_STORAGE_KEY) ||
    sessionStorage.getItem(TOKEN_STORAGE_KEY)
  );
}

export function setToken(token: string, remember: boolean = true): void {
  if (remember) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } else {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function isAuthenticated(): boolean {
  return getToken() !== null;
}

// ==================== API METHODS ====================

// ---------- HEALTH ----------

export async function health(): Promise<HealthResponse> {
  const response = await apiClient.get<HealthResponse>("/health");
  return response.data;
}

// ---------- AUTH ----------

export async function register(data: UserCreate): Promise<UserDetailResponse> {
  const response = await apiClient.post<UserDetailResponse>(
    "/auth/register",
    data
  );
  return response.data;
}

export async function login(credentials: UserLogin): Promise<Token> {
  const response = await apiClient.post<Token>("/auth/login", credentials);
  return response.data;
}

export async function getCurrentUser(): Promise<UserDetailResponse> {
  const response = await apiClient.get<UserDetailResponse>("/auth/me");
  return response.data;
}

// ---------- DOCUMENTS ----------

export async function uploadDocument(
  file: File,
  studySpaceIds: string[], // Al menos un espacio requerido
  title?: string
): Promise<DocumentResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("study_space_ids", studySpaceIds.join(","));
  if (title) {
    formData.append("title", title);
  }

  const response = await apiClient.post<DocumentResponse>(
    "/documents",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
}

export async function listDocuments(
  skip: number = 0,
  limit: number = 100
): Promise<DocumentListResponse> {
  const response = await apiClient.get<DocumentListResponse>("/documents", {
    params: { skip, limit },
  });
  return response.data;
}

export async function getDocument(
  documentId: string
): Promise<DocumentDetailResponse> {
  const response = await apiClient.get<DocumentDetailResponse>(
    `/documents/${documentId}`
  );
  return response.data;
}

export async function updateDocumentTitle(
  documentId: string,
  data: DocumentUpdateTitle
): Promise<DocumentResponse> {
  const response = await apiClient.patch<DocumentResponse>(
    `/documents/${documentId}`,
    data
  );
  return response.data;
}

export async function deleteDocument(documentId: string): Promise<void> {
  await apiClient.delete(`/documents/${documentId}`);
}

export async function getStorageInfo(): Promise<StorageInfo> {
  const response = await apiClient.get<StorageInfo>("/documents/storage");
  return response.data;
}

// ---------- SUMMARIES ----------

export async function uploadAndCreateSummary(
  file: File,
  expertiseLevel: ExpertiseLevel,
  title?: string
): Promise<SummaryResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("expertise_level", expertiseLevel);
  if (title) {
    formData.append("title", title);
  }

  const response = await apiClient.post<SummaryResponse>(
    "/summaries/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
}

export async function createSummaryFromDocuments(
  data: SummaryCreateFromDocuments
): Promise<SummaryResponse> {
  const response = await apiClient.post<SummaryResponse>(
    "/summaries/from-documents",
    data
  );
  return response.data;
}

export async function listSummaries(
  skip: number = 0,
  limit: number = 100
): Promise<SummaryListResponse> {
  const response = await apiClient.get<SummaryListResponse>("/summaries", {
    params: { skip, limit },
  });
  return response.data;
}

export async function getSummary(
  summaryId: string
): Promise<SummaryDetailResponse> {
  const response = await apiClient.get<SummaryDetailResponse>(
    `/summaries/${summaryId}`
  );
  return response.data;
}

export async function deleteSummary(summaryId: string): Promise<void> {
  await apiClient.delete(`/summaries/${summaryId}`);
}

// ---------- QUIZZES ----------

export async function createQuizFromFile(
  file: File,
  topic: string,
  maxQuestions: number = 10,
  difficultyLevel?: number
): Promise<QuizResponse> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("topic", topic);
  formData.append("max_questions", maxQuestions.toString());
  if (difficultyLevel !== undefined) {
    formData.append("difficulty_level", difficultyLevel.toString());
  }

  const response = await apiClient.post<QuizResponse>(
    "/quizzes/generate-from-file",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
}

export async function createQuizFromSummary(
  data: QuizCreateFromSummary
): Promise<QuizResponse> {
  const formData = new FormData();
  formData.append("topic", data.topic || "general");
  if (data.max_questions) {
    formData.append("max_questions", data.max_questions.toString());
  }

  const response = await apiClient.post<QuizResponse>(
    `/quizzes/generate-from-summary/${data.summary_id}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
}

export async function createQuizFromDocument(
  documentId: string,
  topic: string = "general",
  maxQuestions?: number
): Promise<QuizResponse> {
  const formData = new FormData();
  formData.append("topic", topic);
  if (maxQuestions !== undefined) {
    formData.append("max_questions", maxQuestions.toString());
  }

  const response = await apiClient.post<QuizResponse>(
    `/quizzes/generate-from-document/${documentId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
}

export async function listQuizzes(
  skip: number = 0,
  limit: number = 100
): Promise<QuizListResponse> {
  const response = await apiClient.get<QuizListResponse>("/quizzes", {
    params: { skip, limit },
  });
  return response.data;
}

export async function getQuiz(quizId: string): Promise<QuizResponse> {
  const response = await apiClient.get<QuizResponse>(
    `/quizzes/${quizId}`
  );
  return response.data;
}

export async function deleteQuiz(quizId: string): Promise<void> {
  await apiClient.delete(`/quizzes/${quizId}`);
}

// ---------- QUIZ ATTEMPTS ----------

export async function createQuizAttempt(
  data: QuizAttemptCreate
): Promise<QuizAttemptWithQuestionsResponse> {
  const response = await apiClient.post<QuizAttemptWithQuestionsResponse>(
    "/quiz-attempts",
    data
  );
  return response.data;
}

export async function answerQuestion(
  attemptId: string,
  data: QuizAttemptAnswer
): Promise<QuizAttemptAnswerFeedback> {
  const response = await apiClient.post<QuizAttemptAnswerFeedback>(
    `/quiz-attempts/${attemptId}/answer`,
    data
  );
  return response.data;
}

export async function completeQuizAttempt(
  attemptId: string
): Promise<QuizAttemptResponse> {
  const response = await apiClient.post<QuizAttemptResponse>(
    `/quiz-attempts/${attemptId}/complete`
  );
  return response.data;
}

export async function getQuizAttemptResults(
  attemptId: string
): Promise<QuizResultResponse> {
  const response = await apiClient.get<QuizResultResponse>(
    `/quiz-attempts/${attemptId}/results`
  );
  return response.data;
}

// ---------- STATS ----------

export async function getUserProgress(): Promise<UserProgress> {
  const response = await apiClient.get<UserProgress>("/stats/progress");
  return response.data;
}

export async function getUserPerformance(limit: number = 10): Promise<UserPerformance> {
  const response = await apiClient.get<UserPerformance>(
    "/stats/performance",
    { params: { limit } }
  );
  return response.data;
}

export async function getStatsSummary(): Promise<StatsSummary> {
  const response = await apiClient.get<StatsSummary>("/stats/summary");
  return response.data;
}

export async function getProgressBySpace(): Promise<StudySpaceStatsResponse[]> {
  const response = await apiClient.get<StudySpaceStatsResponse[]>("/stats/progress-by-space");
  return response.data;
}

// ---------- STUDY SPACES ----------

export async function createStudySpace(
  data: StudySpaceCreate
): Promise<StudySpaceResponse> {
  const response = await apiClient.post<StudySpaceResponse>(
    "/study-spaces",
    data
  );
  return response.data;
}

export async function listStudySpaces(
  skip: number = 0,
  limit: number = 100
): Promise<StudySpaceListResponse> {
  const response = await apiClient.get<StudySpaceListResponse>("/study-spaces", {
    params: { skip, limit },
  });
  return response.data;
}

export async function getStudySpace(
  spaceId: string
): Promise<StudySpaceDetailResponse> {
  const response = await apiClient.get<StudySpaceDetailResponse>(
    `/study-spaces/${spaceId}`
  );
  return response.data;
}

export async function updateStudySpace(
  spaceId: string,
  data: StudySpaceUpdate
): Promise<StudySpaceResponse> {
  const response = await apiClient.put<StudySpaceResponse>(
    `/study-spaces/${spaceId}`,
    data
  );
  return response.data;
}

export async function deleteStudySpace(
  spaceId: string,
  password: string
): Promise<void> {
  await apiClient.delete(`/study-spaces/${spaceId}`, {
    data: { password }
  });
}

export async function addSummaryToSpace(
  spaceId: string,
  data: AddResourceRequest
): Promise<void> {
  await apiClient.post(`/study-spaces/${spaceId}/summaries`, data);
}

export async function removeSummaryFromSpace(
  spaceId: string,
  summaryId: string
): Promise<void> {
  await apiClient.delete(`/study-spaces/${spaceId}/summaries/${summaryId}`);
}

export async function addDocumentToSpace(
  spaceId: string,
  data: AddResourceRequest
): Promise<void> {
  await apiClient.post(`/study-spaces/${spaceId}/documents`, data);
}

export async function removeDocumentFromSpace(
  spaceId: string,
  documentId: string
): Promise<void> {
  await apiClient.delete(`/study-spaces/${spaceId}/documents/${documentId}`);
}

export async function getStudySpaceStats(
  spaceId: string
): Promise<StudySpaceStatsResponse> {
  const response = await apiClient.get<StudySpaceStatsResponse>(
    `/study-spaces/${spaceId}/stats`
  );
  return response.data;
}

export async function getStudySpaceQuizzes(
  spaceId: string,
  skip: number = 0,
  limit: number = 100
): Promise<QuizListResponse> {
  const response = await apiClient.get<QuizListResponse>(
    `/study-spaces/${spaceId}/quizzes`,
    { params: { skip, limit } }
  );
  return response.data;
}

export async function createQuizFromSpace(
  spaceId: string,
  data: { topic?: string; max_questions?: number }
): Promise<QuizResponse> {
  const response = await apiClient.post<QuizResponse>(
    `/study-spaces/${spaceId}/quizzes`,
    data
  );
  return response.data;
}

// ==================== EXPORT API CLIENT ====================

export default apiClient
