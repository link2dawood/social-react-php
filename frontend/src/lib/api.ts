// Central API client for talking to the PHP backend.
// Uses session cookies (credentials: 'include') so login and all
// authenticated calls work from the themed frontend.

const BASE_URL: string =
  // Prefer explicit env var when set (e.g. VITE_API_BASE_URL="https://mydomain.com/backend")
  (import.meta as any).env?.VITE_API_BASE_URL ??
  // Fallback: same origin as the frontend, `/backend` path
  `${window.location.origin}/backend`;

type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  let json: ApiEnvelope<T>;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw new Error('Invalid JSON response from server');
  }

  if (!json.success) {
    throw new Error(json.error || json.message || 'Request failed');
  }

  return (json.data ?? (json as unknown as T)) as T;
}

// Types that mirror the backend responses closely enough for the current UI.
export type PoliticalParty = 'democrat' | 'republican' | 'independent';

export interface ApiUser {
  id: string;
  email: string;
  name?: string | null;
  displayName?: string | null;
  username: string;
  avatar?: string | null;
  bio?: string | null;
  party: PoliticalParty;
  followerCount: number;
  followers: string[];
  following: string[];
  friends: string[];
  earnings: number;
  totalTips: number;
  tokens: number;
  impressions: number;
  isVerified?: boolean;
  joinDate: string;
}

export interface ApiPost {
  id: string;
  userId: string;
  content: string;
  image?: string | null;
  video?: string | null;
  type: 'post' | 'meme';
  party: PoliticalParty;
  timestamp: string;
  likes: { userId: string; party: PoliticalParty }[];
  comments: { id: string; userId: string; content: string; timestamp: string }[];
  tips: { userId: string; amount: number; timestamp: string }[];
  shares: number;
}

// 🔐 Authentication ---------------------------------------------------------

export async function signup(payload: {
  email: string;
  password: string;
  username?: string;
  displayName?: string;
  name?: string;
  party?: PoliticalParty;
  bio?: string;
}) {
  // Backend: POST /auth.php?action=signup
  const result = await request<{ user: ApiUser; user_id: number }>(
    `/auth.php?action=signup`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );
  return result.user;
}

export async function login(emailOrUsername: string, password: string) {
  // Backend accepts email OR username in the "email" field
  const result = await request<{ user: ApiUser }>(`/auth.php?action=login`, {
    method: 'POST',
    body: JSON.stringify({ email: emailOrUsername, password }),
  });
  return result.user;
}

export async function getCurrentUser() {
  const result = await request<{ user: ApiUser }>(`/auth.php?action=me`, {
    method: 'GET',
  });
  return result.user;
}

export async function logout() {
  await request<unknown>(`/auth.php?action=logout`, {
    method: 'POST',
  });
}

// 📝 Posts / Content --------------------------------------------------------

export async function getPosts(params?: { limit?: number; offset?: number }) {
  const query = new URLSearchParams({
    action: 'list',
    ...(params?.limit ? { limit: String(params.limit) } : {}),
    ...(params?.offset ? { offset: String(params.offset) } : {}),
  });

  return request<ApiPost[]>(`/content.php?${query.toString()}`, {
    method: 'GET',
  });
}

export async function getPost(id: string | number) {
  const query = new URLSearchParams({
    action: 'get',
    id: String(id),
  });

  return request<ApiPost>(`/content.php?${query.toString()}`, {
    method: 'GET',
  });
}

export async function createPost(payload: {
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  type?: 'post' | 'meme';
  party?: PoliticalParty;
}) {
  return request<ApiPost>(`/content.php?action=create`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// 📤 File Upload ------------------------------------------------------------

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/upload.php`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  const json = await res.json();

  if (!json.success) {
    throw new Error(json.error || 'Upload failed');
  }

  return {
    file_url: json.file_url,
    media_type: json.media_type,
    post_id: json.post_id
  };
}

// Export api object for convenience
export const api = {
  signup,
  login,
  logout,
  getCurrentUser,
  getPosts,
  getPost,
  createPost,
  uploadFile,
};
