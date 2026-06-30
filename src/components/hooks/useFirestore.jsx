import { useState, useEffect } from 'react';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../../firebase';

export function useFirestore(studentId) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Recursively replace undefined values with null so Firestore never rejects the write.
  // Old documents were saved before certain fields (e.g. `source`) were added, so spreading
  // them can produce undefined slots that Firestore refuses.
  const sanitizeForFirestore = (obj) => {
    if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
    if (obj !== null && typeof obj === 'object') {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, v === undefined ? null : sanitizeForFirestore(v)])
      );
    }
    return obj;
  };

  // Save data to Firestore
  const saveToFirestore = async (semester, subject, data, type) => {
    if (!studentId) return false;

    try {
      setIsSyncing(true);

      const docRef = doc(db, 'academic-data', studentId);
      const key = `${semester}-${subject}`;

      await setDoc(docRef, {
        [key]: {
          semester,
          subject,
          type,
          data: sanitizeForFirestore(data),
          lastModified: new Date().toISOString()
        },
        studentId,
        lastModified: serverTimestamp()
      }, { merge: true });

      setLastSynced(new Date());
      return true;
    } catch (error) {
      console.error('Error saving to Firestore:', error);
      return false;
    } finally {
      setIsSyncing(false);
    }
  };

  // Load all data for student
  const loadAllData = async () => {
    if (!studentId) return {};

    try {
      setIsSyncing(true);
      const docRef = doc(db, 'academic-data', studentId);
      
      const docSnap = await getDoc(docRef);
      const data = {};
      
      if (docSnap.exists()) {
        const docData = docSnap.data();
        Object.keys(docData).forEach(key => {
          if (key !== 'lastModified' && key !== 'studentId') {
            data[key] = docData[key];
          }
        });
      }
      
      setLastSynced(new Date());
      return data;
    } catch (error) {
      console.error('Error loading all data:', error);
      return {};
    } finally {
      setIsSyncing(false);
    }
  };

  return {
    isOnline,
    isSyncing,
    lastSynced,
    saveToFirestore,
    loadAllData
  };
}
