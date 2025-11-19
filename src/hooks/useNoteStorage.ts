import { useState, useEffect, useCallback } from 'react';

interface LectureSession {
  transcript: string;
  notes: string;
  duration: number;
  createdAt: string;
}

const STORAGE_KEY_PREFIX = 'lecture_notes_';
const AUTOSAVE_INTERVAL = 10000; // 10 seconds

export const useNoteStorage = () => {
  const [currentSession, setCurrentSession] = useState<LectureSession | null>(null);
  const [hasUnsavedSession, setHasUnsavedSession] = useState(false);

  // Check for unsaved session on mount
  useEffect(() => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_KEY_PREFIX));
    if (keys.length > 0) {
      setHasUnsavedSession(true);
    }
  }, []);

  // Auto-save current session
  useEffect(() => {
    if (!currentSession) return;

    const interval = setInterval(() => {
      saveSession(currentSession);
    }, AUTOSAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [currentSession]);

  const saveSession = useCallback((session: LectureSession) => {
    const key = `${STORAGE_KEY_PREFIX}${session.createdAt}`;
    localStorage.setItem(key, JSON.stringify(session));
  }, []);

  const loadLastSession = useCallback((): LectureSession | null => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_KEY_PREFIX));
    if (keys.length === 0) return null;

    // Get most recent session
    const lastKey = keys.sort().reverse()[0];
    const data = localStorage.getItem(lastKey);
    
    if (data) {
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('Failed to parse saved session:', e);
        return null;
      }
    }
    
    return null;
  }, []);

  const createNewSession = useCallback((): LectureSession => {
    const session: LectureSession = {
      transcript: '',
      notes: '',
      duration: 0,
      createdAt: new Date().toISOString(),
    };
    setCurrentSession(session);
    setHasUnsavedSession(false);
    return session;
  }, []);

  const updateSession = useCallback((updates: Partial<LectureSession>) => {
    setCurrentSession(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  const clearSessions = useCallback(() => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_KEY_PREFIX));
    keys.forEach(key => localStorage.removeItem(key));
    setHasUnsavedSession(false);
  }, []);

  const finalizeSession = useCallback(() => {
    if (currentSession) {
      saveSession(currentSession);
    }
  }, [currentSession, saveSession]);

  return {
    currentSession,
    hasUnsavedSession,
    createNewSession,
    loadLastSession,
    updateSession,
    saveSession,
    clearSessions,
    finalizeSession,
  };
};
