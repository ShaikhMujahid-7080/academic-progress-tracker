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
import bcrypt from 'bcryptjs';
import { shouldDeleteStudent } from '../../utils/studentUtils';

export function useStudentManagement() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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
        // Create admin with default password hash and admission info
        const adminWithPassword = {
          ...ADMIN_STUDENT,
          password: bcrypt.hashSync('admin123', 10), // Default admin password
          isProtected: true,
          role: 'admin',
          admissionYear: ADMIN_STUDENT.admissionYear || new Date().getFullYear(),
          isDSY: ADMIN_STUDENT.isDSY || false
        };
        studentsList.push(adminWithPassword);
        // Save admin to Firestore
        await setDoc(doc(db, 'students', ADMIN_STUDENT.rollNo), adminWithPassword);
      }

      // Auto-deletion of graduated students (1 year post graduation)
      const expiredStudents = studentsList.filter(s => s.rollNo !== ADMIN_STUDENT.rollNo && shouldDeleteStudent(s));

      if (expiredStudents.length > 0) {
        console.log(`Auto-deleting ${expiredStudents.length} expired student profiles.`);
        const batch = writeBatch(db);
        for (const student of expiredStudents) {
          batch.delete(doc(db, 'students', student.rollNo));
          batch.delete(doc(db, 'userNotes', student.rollNo));
          const academicQuery = query(collection(db, 'academic-data'), where('studentId', '==', student.rollNo));
          const academicDocs = await getDocs(academicQuery);
          academicDocs.forEach((d) => batch.delete(d.ref));
        }
        await batch.commit();
        const remainingStudents = studentsList.filter(s => !expiredStudents.some(es => es.rollNo === s.rollNo));
        setStudents(remainingStudents);
        // Update the list for subsequent restoration logic
        studentsList.splice(0, studentsList.length, ...remainingStudents);
      } else {
        setStudents(studentsList);
      }

      // Restore selected student from localStorage when available
      try {
        const stored = localStorage.getItem('selected-student');
        if (stored) {
          const parsed = JSON.parse(stored);
          const found = studentsList.find(s => s.rollNo === parsed.rollNo);
          if (found) {
            setSelectedStudent(found);
          } else {
            // Stored student no longer exists; clear it
            localStorage.removeItem('selected-student');
          }
        }
      } catch (e) {
        // ignore malformed storage
        localStorage.removeItem('selected-student');
      }

      setHasInitialized(true);

    } catch (error) {
      console.error('Error loading students:', error);
      // Fallback to admin
      const adminWithPassword = {
        ...ADMIN_STUDENT,
        password: bcrypt.hashSync('admin123', 10),
        isProtected: true,
        role: 'admin',
        admissionYear: ADMIN_STUDENT.admissionYear || new Date().getFullYear(),
        isDSY: ADMIN_STUDENT.isDSY || false,
        isYD: ADMIN_STUDENT.isYD || false
      };
      setStudents([adminWithPassword]);
      setHasInitialized(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Create new student with optional password and role + admission data
  const createStudent = async (rollNo, name, password = '', role = 'student', admissionYear = (new Date()).getFullYear(), isDSY = false, isYD = false) => {
    try {
      const yearNum = Number(admissionYear);
      if (!Number.isInteger(yearNum) || yearNum < 2000 || yearNum > new Date().getFullYear()) {
        throw new Error('Invalid admission year');
      }
      if (typeof isDSY !== 'boolean') {
        throw new Error('Invalid DSY flag');
      }

      const newStudent = {
        rollNo,
        name,
        admissionYear: yearNum,
        isDSY,
        isYD,
        isProtected: !!password,
        password: password ? bcrypt.hashSync(password, 10) : null,
        role: role
      };

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

  // Update student role
  const updateStudentRole = async (rollNo, newRole) => {
    try {
      if (rollNo === ADMIN_STUDENT.rollNo) {
        throw new Error('Cannot change admin role');
      }

      const student = students.find(s => s.rollNo === rollNo);
      if (!student) {
        throw new Error('Student not found');
      }

      // Build the updated student object
      let updatedStudent = { ...student, role: newRole };

      // If promoting to co-leader, add default permissions (canCreateUsers is true by default)
      if (newRole === 'co-leader' && !student.permissions) {
        updatedStudent.permissions = {
          canCreateUsers: true,
          canPostNotices: true,
          canAppointCoLeaders: false,
          canManagePasswords: false
        };
      }

      // If demoting from co-leader to student, remove permissions
      if (newRole === 'student' && student.role === 'co-leader') {
        delete updatedStudent.permissions;
      }

      await setDoc(doc(db, 'students', rollNo), updatedStudent);

      // Update local state
      setStudents(students.map(s =>
        s.rollNo === rollNo ? updatedStudent : s
      ));

      // Update selected student if it's the current one
      if (selectedStudent && selectedStudent.rollNo === rollNo) {
        setSelectedStudent(updatedStudent);
        localStorage.setItem('selected-student', JSON.stringify(updatedStudent));
      }

      return true;
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  };

  // Update student name
  const updateStudentName = async (rollNo, newName) => {
    try {
      if (!newName || !newName.trim()) {
        throw new Error('Name cannot be empty');
      }

      const student = students.find(s => s.rollNo === rollNo);
      if (!student) {
        throw new Error('Student not found');
      }

      const updatedStudent = { ...student, name: newName.trim() };
      await setDoc(doc(db, 'students', rollNo), updatedStudent);

      // Update local state
      setStudents(students.map(s =>
        s.rollNo === rollNo ? updatedStudent : s
      ));

      // Update selected student if it's the current one
      if (selectedStudent && selectedStudent.rollNo === rollNo) {
        setSelectedStudent(updatedStudent);
        localStorage.setItem('selected-student', JSON.stringify(updatedStudent));
      }

      return true;
    } catch (error) {
      console.error('Error updating name:', error);
      throw error;
    }
  };

  // Update student isDSY flag
  const updateStudentDSY = async (rollNo, newIsDSY) => {
    try {
      if (typeof newIsDSY !== 'boolean') {
        throw new Error('isDSY must be a boolean');
      }

      const student = students.find(s => s.rollNo === rollNo);
      if (!student) {
        throw new Error('Student not found');
      }

      const updatedStudent = { ...student, isDSY: newIsDSY };
      await setDoc(doc(db, 'students', rollNo), updatedStudent);

      // Update local state
      setStudents(students.map(s =>
        s.rollNo === rollNo ? updatedStudent : s
      ));

      // Update selected student if it's the current one
      if (selectedStudent && selectedStudent.rollNo === rollNo) {
        setSelectedStudent(updatedStudent);
        localStorage.setItem('selected-student', JSON.stringify(updatedStudent));
      }

      return true;
    } catch (error) {
      console.error('Error updating isDSY:', error);
      throw error;
    }
  };

  // Update YD status
  const updateStudentYD = async (rollNo, newIsYD) => {
    try {
      if (typeof newIsYD !== 'boolean') {
        throw new Error('isYD must be a boolean');
      }

      const student = students.find(s => s.rollNo === rollNo);
      if (!student) {
        throw new Error('Student not found');
      }

      const updatedStudent = { ...student, isYD: newIsYD };
      await setDoc(doc(db, 'students', rollNo), updatedStudent);

      // Update local state
      setStudents(students.map(s =>
        s.rollNo === rollNo ? updatedStudent : s
      ));

      // Update selected student if it's the current one
      if (selectedStudent && selectedStudent.rollNo === rollNo) {
        setSelectedStudent(updatedStudent);
        localStorage.setItem('selected-student', JSON.stringify(updatedStudent));
      }

      return true;
    } catch (error) {
      console.error('Error updating isYD:', error);
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

      // Delete user notes
      const notesDoc = doc(db, 'userNotes', rollNo);
      batch.delete(notesDoc);

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

  // Authenticate student with password
  const authenticateStudent = async (student, password) => {
    try {
      if (!student.isProtected) {
        return true; // No password required
      }

      if (!password) {
        return false; // Password required but not provided
      }

      const isValid = await bcrypt.compare(password, student.password);
      return isValid;
    } catch (error) {
      console.error('Error authenticating student:', error);
      return false;
    }
  };

  // Update student password
  const updateStudentPassword = async (rollNo, newPassword, removePassword = false) => {
    try {
      const student = students.find(s => s.rollNo === rollNo);
      if (!student) {
        throw new Error('Student not found');
      }

      const updatedStudent = {
        ...student,
        password: removePassword ? null : bcrypt.hashSync(newPassword, 10),
        isProtected: !removePassword
      };

      await setDoc(doc(db, 'students', rollNo), updatedStudent);

      // Update local state
      setStudents(students.map(s =>
        s.rollNo === rollNo ? updatedStudent : s
      ));

      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  };

  // Update co-leader permissions
  const updateCoLeaderPermissions = async (rollNo, permissions) => {
    try {
      const student = students.find(s => s.rollNo === rollNo);
      if (!student) {
        throw new Error('Student not found');
      }

      if (student.role !== 'co-leader') {
        throw new Error('Can only update permissions for co-leaders');
      }

      const updatedStudent = { ...student, permissions };
      await setDoc(doc(db, 'students', rollNo), updatedStudent);

      // Update local state
      setStudents(students.map(s =>
        s.rollNo === rollNo ? updatedStudent : s
      ));

      // Update selected student if it's the current one
      if (selectedStudent && selectedStudent.rollNo === rollNo) {
        setSelectedStudent(updatedStudent);
        localStorage.setItem('selected-student', JSON.stringify(updatedStudent));
      }

      return true;
    } catch (error) {
      console.error('Error updating co-leader permissions:', error);
      throw error;
    }
  };

  // Select student - now clears previous student's local data
  const selectStudent = (student) => {
    // Clear any existing local data when switching students
    const previousStudent = selectedStudent;
    if (previousStudent && previousStudent.rollNo !== student?.rollNo) {
      // Clear the previous student's local storage
      const previousKey = `academic-data-${previousStudent.rollNo}`;
      localStorage.removeItem(previousKey);
    }

    setSelectedStudent(student);
    if (student) {
      localStorage.setItem('selected-student', JSON.stringify(student));
    } else {
      localStorage.removeItem('selected-student');
    }
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
    authenticateStudent,
    updateStudentPassword,
    updateStudentRole,
    updateCoLeaderPermissions,
    updateStudentName,
    updateStudentDSY,
    updateStudentYD,
    loadStudents
  };
}
