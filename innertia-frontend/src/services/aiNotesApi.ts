import axios from 'axios';
import type { Class } from '../types';

// Types for AI Notes
export interface GenerateRequest {
  class_id: string;
  lesson_title: string;
  raw_text: string;
}

export interface Section {
  heading: string;
  content: string;
  key_points: string[];
}

export interface MermaidDiagram {
  title: string;
  code: string;
}

export interface ThreeDSuggestion {
  type: string;
  description: string;
}

export interface ImageResult {
  url: string;
  alt: string;
  photographer: string;
  photographer_url: string;
}

export interface GenerateResponse {
  title: string;
  overview: string;
  sections: Section[];
  mermaid_diagrams: MermaidDiagram[];
  image_queries: string[];
  three_d_suggestions: ThreeDSuggestion[];
  images: ImageResult[];
}

export interface SaveNotesRequest {
  class_id: string;
  lesson_title: string;
  raw_text: string;
  structured_content: Record<string, unknown>;
}

export interface AINoteOut {
  id: string;
  class_id: string;
  lesson_title: string;
  raw_text: string;
  structured_content: Record<string, unknown>;
  created_by: string;
  created_at: string;
}

export interface AINoteList {
  notes: AINoteOut[];
  total: number;
}

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// Create axios instance
const aiNotesClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minute timeout for AI generation
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth interceptor
aiNotesClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// AI Notes API functions
export const aiNotesApi = {
  // Generate immersive notes
  generateNotes: async (data: GenerateRequest): Promise<GenerateResponse> => {
    const response = await aiNotesClient.post<GenerateResponse>('/ai-notes/generate', data);
    return response.data;
  },

  // Save generated notes
  saveNotes: async (data: SaveNotesRequest): Promise<AINoteOut> => {
    const response = await aiNotesClient.post<AINoteOut>('/ai-notes/save', data);
    return response.data;
  },

  // Get all AI notes
  getNotes: async (classId?: string): Promise<AINoteList> => {
    const params = classId ? { class_id: classId } : {};
    const response = await aiNotesClient.get<AINoteList>('/ai-notes', { params });
    return response.data;
  },

  // Get specific AI note
  getNote: async (noteId: string): Promise<AINoteOut> => {
    const response = await aiNotesClient.get<AINoteOut>(`/ai-notes/${noteId}`);
    return response.data;
  },

  // Delete AI note
  deleteNote: async (noteId: string): Promise<void> => {
    await aiNotesClient.delete(`/ai-notes/${noteId}`);
  },
};

export default aiNotesApi;
