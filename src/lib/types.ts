export type LinkType = 'Web' | 'Video' | 'Document';
export type LinkSubtype = 'YouTube' | 'Instagram' | 'AI' | 'Other' | 'None';

export interface Category {
  id: string;
  name: string;
  type: LinkType;
  subtype: LinkSubtype;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  user_id?: string;
}

export interface Link {
  id: string;
  url: string;
  name: string;
  type: LinkType;
  subtype: LinkSubtype;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  file_name?: string;
  file_data?: string;
  file_url?: string;
  notes?: string;
  user_id?: string;
}

export interface Note {
  id: string;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  user_id?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  updated_at: string;
}

export type Tab = 'home' | 'web' | 'videos' | 'documents' | 'notes';
export type VideoSubtab = 'YouTube' | 'Instagram' | 'AI' | 'Other';
export type ThemeMode = 'light' | 'dark';
