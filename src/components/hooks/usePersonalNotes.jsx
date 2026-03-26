import { useState, useEffect, useCallback } from 'react';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase';

export function usePersonalNotes(userId) {
  const [notes, setNotes] = useState('');
  const [credentials, setCredentials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [error, setError] = useState(null);

  const fetchNotes = useCallback(async () => {
    if (!userId) {
      setNotes('');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const docRef = doc(db, 'userNotes', userId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setNotes(data.content || '');
        setCredentials(data.credentials || []);
        setLastSaved(data.updatedAt ? data.updatedAt.toDate() : null);
      } else {
        setNotes('');
        setCredentials([]);
        setLastSaved(null);
      }
    } catch (err) {
      console.error('Error loading notes:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Load notes on userId change
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // Auto-save notes with debouncing
  useEffect(() => {
    if (!userId || isLoading) return;

    const saveTimeout = setTimeout(async () => {
      try {
        setIsSaving(true);

        const docRef = doc(db, 'userNotes', userId);
        await setDoc(docRef, {
          content: notes,
          credentials,
          updatedAt: serverTimestamp(),
          userId
        });

        setLastSaved(new Date());
        setError(null);
      } catch (err) {
        console.error('Error saving notes:', err);
        setError('Failed to save notes: ' + err.message);
      } finally {
        setIsSaving(false);
      }
    }, 1000); // Save 1 second after last change

    return () => clearTimeout(saveTimeout);
  }, [notes, credentials, userId, isLoading]);

  const addCredential = (cred) => {
    setCredentials(prev => [...prev, { ...cred, id: Date.now().toString() }]);
  };

  const deleteCredential = (id) => {
    setCredentials(prev => prev.filter(c => c.id !== id));
  };

  const updateNotes = (newNotes) => {
    setNotes(newNotes);
  };

  const clearNotes = async () => {
    if (!userId) return;

    try {
      setIsSaving(true);
      const docRef = doc(db, 'userNotes', userId);
      await setDoc(docRef, {
        content: '',
        updatedAt: serverTimestamp(),
        userId
      }, { merge: true });
      setNotes('');
      setLastSaved(new Date());
    } catch (err) {
      console.error('Error clearing notes:', err);
      setError('Failed to clear notes: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    notes,
    credentials,
    updateNotes,
    addCredential,
    deleteCredential,
    clearNotes,
    refreshNotes: fetchNotes,
    isLoading,
    isSaving,
    lastSaved,
    error
  };
}
