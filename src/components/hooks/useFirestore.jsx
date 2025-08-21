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

  // Save data to Firestore
  const saveToFirestore = async (semester, subject, data, type) => {
    if (!studentId) return false;
    
    try {
      setIsSyncing(true);
      
      const docRef = doc(db, 'academic-data', `${studentId}-${semester}-${subject}`);
      
      await setDoc(docRef, {
        studentId,
        semester,
        subject,
        type,
        data,
        timestamp: serverTimestamp(),
        lastModified: new Date().toISOString()
      });
      
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
      const q = query(
        collection(db, 'academic-data'),
        where('studentId', '==', studentId)
      );
      
      return new Promise((resolve, reject) => {
        const unsubscribe = onSnapshot(q, 
          (querySnapshot) => {
            const data = {};
            querySnapshot.forEach((doc) => {
              const docData = doc.data();
              const key = `${docData.semester}-${docData.subject}`;
              data[key] = docData;
            });
            setLastSynced(new Date());
            resolve(data);
          },
          (error) => {
            console.error('Error loading all data:', error);
            reject(error);
          }
        );
        
        return unsubscribe;
      });
    } catch (error) {
      console.error('Error setting up real-time listener:', error);
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
