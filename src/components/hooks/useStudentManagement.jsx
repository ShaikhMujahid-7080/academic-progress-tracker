import { useState, useEffect } from 'react';
import { 
  doc, 
  setDoc, 
  deleteDoc,
  collection, 
  getDocs,
  query,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../firebase';
import { ADMIN_STUDENT } from '../../data/subjects';

export function useStudentManagement() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [hasInitialized, setHasInitialized] = useState(false);

  // Check if current student is admin
  const isAdmin = selectedStudent && 
    selectedStudent.rollNo === ADMIN_STUDENT.rollNo;

  // Load all students from Firestore
  const loadStudents = async () => {
    try {
      setIsLoading(true);
      const querySnapshot = await getDocs(collection(db, 'students'));
      const studentsList = [];
      
      querySnapshot.forEach((doc) => {
        studentsList.push(doc.data());
      });

      // Add admin student if not exists
      const adminExists = studentsList.some(s => s.rollNo === ADMIN_STUDENT.rollNo);
      if (!adminExists) {
        studentsList.push(ADMIN_STUDENT);
        // Save admin to Firestore
        await setDoc(doc(db, 'students', ADMIN_STUDENT.rollNo), ADMIN_STUDENT);
      }

      setStudents(studentsList);
      setHasInitialized(true);
      
      // Remove any persistent admin authentication since we now ask for password each time

    } catch (error) {
      console.error('Error loading students:', error);
      // Fallback to admin
      setStudents([ADMIN_STUDENT]);
      setHasInitialized(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Create new student
  const createStudent = async (rollNo, name) => {
    try {
      const newStudent = { rollNo, name };
      
      // Check if student already exists
      const exists = students.some(s => s.rollNo === rollNo);
      if (exists) {
        throw new Error('Student with this roll number already exists');
      }

      // Save to Firestore
      await setDoc(doc(db, 'students', rollNo), newStudent);
      
      // Update local state
      setStudents([...students, newStudent]);
      
      return true;
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  };

  // Delete student
  const deleteStudent = async (rollNo) => {
    try {
      // Prevent deleting admin
      if (rollNo === ADMIN_STUDENT.rollNo) {
        throw new Error('Cannot delete admin student');
      }

      // Delete student document
      await deleteDoc(doc(db, 'students', rollNo));
      
      // Delete all academic data for this student
      const batch = writeBatch(db);
      const academicQuery = query(
        collection(db, 'academic-data'),
        where('studentId', '==', rollNo)
      );
      
      const academicDocs = await getDocs(academicQuery);
      academicDocs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      
      // Update local state
      setStudents(students.filter(s => s.rollNo !== rollNo));
      
      // If deleted student was selected, clear selection
      if (selectedStudent && selectedStudent.rollNo === rollNo) {
        setSelectedStudent(null);
        localStorage.removeItem('selected-student');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  };

  // Select student - now clears previous student's local data
  const selectStudent = (student) => {
    // Clear any existing local data when switching students
    const previousStudent = selectedStudent;
    if (previousStudent && previousStudent.rollNo !== student.rollNo) {
      // Clear the previous student's local storage
      const previousKey = `academic-data-${previousStudent.rollNo}`;
      localStorage.removeItem(previousKey);
    }
    
    setSelectedStudent(student);
    localStorage.setItem('selected-student', JSON.stringify(student));
  };

  // Initialize on mount
  useEffect(() => {
    loadStudents();
  }, []);

  return {
    students,
    selectedStudent,
    isAdmin,
    isLoading,
    hasInitialized,
    createStudent,
    deleteStudent,
    selectStudent,
    loadStudents
  };
}
