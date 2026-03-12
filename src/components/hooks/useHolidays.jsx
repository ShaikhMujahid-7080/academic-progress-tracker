import { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  orderBy,
  query
} from 'firebase/firestore';
import { db } from '../../firebase';
import { ADMIN_STUDENT } from '../../data/subjects';

export function useHolidays(currentUser) {
  const [holidays, setHolidays] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = currentUser?.rollNo === ADMIN_STUDENT.rollNo;
  const isCoLeader = currentUser?.role === 'co-leader';
  
  const canManageHolidays = isAdmin || isCoLeader;

  useEffect(() => {
    const q = query(
      collection(db, 'holidays'),
      orderBy('date', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const holidayList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore timestamp to Date if needed, though we'll likely store as string or specific format
        date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
      }));
      setHolidays(holidayList);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching holidays:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addHoliday = async (holidayData) => {
    if (!canManageHolidays) return { success: false, error: "Permission denied" };
    
    setIsSaving(true);
    try {
      await addDoc(collection(db, 'holidays'), {
        ...holidayData,
        createdBy: currentUser.name,
        createdByRoll: currentUser.rollNo,
        createdAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error("Error adding holiday:", error);
      return { success: false, error: error.message };
    } finally {
      setIsSaving(false);
    }
  };

  const updateHoliday = async (id, holidayData) => {
    if (!canManageHolidays) return { success: false, error: "Permission denied" };
    
    setIsSaving(true);
    try {
      const holidayRef = doc(db, 'holidays', id);
      await updateDoc(holidayRef, {
        ...holidayData,
        updatedAt: serverTimestamp()
      });
      return { success: true };
    } catch (error) {
      console.error("Error updating holiday:", error);
      return { success: false, error: error.message };
    } finally {
      setIsSaving(false);
    }
  };

  const deleteHoliday = async (id) => {
    if (!canManageHolidays) return { success: false, error: "Permission denied" };
    
    setIsSaving(true);
    try {
      await deleteDoc(doc(db, 'holidays', id));
      return { success: true };
    } catch (error) {
      console.error("Error deleting holiday:", error);
      return { success: false, error: error.message };
    } finally {
      setIsSaving(false);
    }
  };

  return {
    holidays,
    isLoading,
    isSaving,
    canManageHolidays,
    addHoliday,
    updateHoliday,
    deleteHoliday
  };
}
