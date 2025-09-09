import { useState, useEffect } from 'react';
import { 
  doc, 
  getDoc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase';

export function usePersonalNotes(userId) {
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [error, setError] = useState(null);

  // Load notes on userId change
  useEffect(() => {
    if (!userId) {
      setNotes('');
      setIsLoading(false);
      return;
    }

    const loadNotes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const docRef = doc(db, 'userNotes', userId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setNotes(docSnap.data().content || '');
          setLastSaved(docSnap.data().updatedAt ? docSnap.data().updatedAt.toDate() : null);
        } else {
          setNotes('');
          setLastSaved(null);
        }
      } catch (err) {
        console.error('Error loading notes:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadNotes();
  }, [userId]);

  // Auto-save notes with debouncing
  useEffect(() => {
    if (!userId || isLoading) return;

    const saveTimeout = setTimeout(async () => {
      try {
        setIsSaving(true);
        
        const docRef = doc(db, 'userNotes', userId);
        await setDoc(docRef, {
          content: notes,
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
  }, [notes, userId, isLoading]);

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
      });
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
    updateNotes,
    clearNotes,
    isLoading,
    isSaving,
    lastSaved,
    error
  };
}
