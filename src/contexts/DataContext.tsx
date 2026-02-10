// src/contexts/DataContext.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  fetchCategories,
  fetchLinks,
  fetchNotes,
  upsertCategory,
  upsertLink,
  upsertNote,
  deleteCategory as deleteCategoryService,
  deleteLink as deleteLinkService,
  deleteNote as deleteNoteService,
} from '../services/dataService';
import { v4 as uuidv4 } from 'uuid';

interface Category {
  id: string;
  name: string;
  type: string;
  subtype: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface Link {
  id: string;
  url: string;
  name: string;
  type: string;
  subtype: string;
  category_id: string | null;
  user_id: string;
  file_name: string | null;
  file_url: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface Note {
  id: string;
  title: string;
  body: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface DataContextType {
  categories: Category[];
  links: Link[];
  notes: Note[];
  loading: boolean;
  addCategory: (name: string, type: string, subtype?: string) => Promise<Category>;
  addLink: (url: string, name: string, type: string, categoryId?: string, subtype?: string, notes?: string) => Promise<Link>;
  addNote: (title: string, body?: string) => Promise<Note>;
  removeCategory: (id: string) => Promise<void>;
  removeLink: (id: string) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  updateLink: (id: string, updates: Partial<Link>) => Promise<void>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
};

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshData = useCallback(async () => {
    if (!user) {
      setCategories([]);
      setLinks([]);
      setNotes([]);
      return;
    }

    setLoading(true);
    try {
      const [cats, lnks, nts] = await Promise.all([
        fetchCategories(user.id),
        fetchLinks(user.id),
        fetchNotes(user.id),
      ]);
      setCategories(cats);
      setLinks(lnks);
      setNotes(nts);
      console.log('Data loaded:', { categories: cats.length, links: lnks.length, notes: nts.length });
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load data when user changes (sign in / sign out)
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const addCategory = async (name: string, type: string, subtype?: string) => {
    if (!user) throw new Error('Not authenticated');
    const newCat = await upsertCategory({
      id: uuidv4(),
      name,
      type,
      subtype: subtype || 'None',
      user_id: user.id,
    });
    setCategories((prev) => [...prev, newCat]);
    return newCat;
  };

  const addLink = async (
    url: string,
    name: string,
    type: string,
    categoryId?: string,
    subtype?: string,
    linkNotes?: string
  ) => {
    if (!user) throw new Error('Not authenticated');
    const newLink = await upsertLink({
      id: uuidv4(),
      url,
      name,
      type,
      subtype: subtype || 'None',
      category_id: categoryId || null,
      user_id: user.id,
      notes: linkNotes || '',
    });
    setLinks((prev) => [...prev, newLink]);
    return newLink;
  };

  const addNote = async (title: string, body?: string) => {
    if (!user) throw new Error('Not authenticated');
    const newNote = await upsertNote({
      id: uuidv4(),
      title,
      body: body || '',
      user_id: user.id,
    });
    setNotes((prev) => [...prev, newNote]);
    return newNote;
  };

  const removeCategory = async (id: string) => {
    await deleteCategoryService(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
    // Also remove links in this category or set their category_id to null
    setLinks((prev) =>
      prev.map((l) => (l.category_id === id ? { ...l, category_id: null } : l))
    );
  };

  const removeLink = async (id: string) => {
    await deleteLinkService(id);
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  const removeNote = async (id: string) => {
    await deleteNoteService(id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    if (!user) throw new Error('Not authenticated');
    const existing = categories.find((c) => c.id === id);
    if (!existing) return;
    const updated = await upsertCategory({ ...existing, ...updates, user_id: user.id });
    setCategories((prev) => prev.map((c) => (c.id === id ? updated : c)));
  };

  const updateLink = async (id: string, updates: Partial<Link>) => {
    if (!user) throw new Error('Not authenticated');
    const existing = links.find((l) => l.id === id);
    if (!existing) return;
    const updated = await upsertLink({ ...existing, ...updates, user_id: user.id });
    setLinks((prev) => prev.map((l) => (l.id === id ? updated : l)));
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    if (!user) throw new Error('Not authenticated');
    const existing = notes.find((n) => n.id === id);
    if (!existing) return;
    const updated = await upsertNote({ ...existing, ...updates, user_id: user.id });
    setNotes((prev) => prev.map((n) => (n.id === id ? updated : n)));
  };

  return (
    <DataContext.Provider
      value={{
        categories,
        links,
        notes,
        loading,
        addCategory,
        addLink,
        addNote,
        removeCategory,
        removeLink,
        removeNote,
        updateCategory,
        updateLink,
        updateNote,
        refreshData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
