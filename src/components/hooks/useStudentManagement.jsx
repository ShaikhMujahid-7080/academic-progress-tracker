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
import { signInWithPopup } from 'firebase/auth';
import { db, auth, googleProvider } from '../../firebase';
import { ADMIN_STUDENT } from '../../data/subjects';
import bcrypt from 'bcryptjs';
import { shouldDeleteStudent } from '../../utils/studentUtils';
import { supabase } from '../../supabase';

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
        const adminWithPassword = {
          ...ADMIN_STUDENT,
          password: bcrypt.hashSync('admin123', 10),
          isProtected: true,
          role: 'admin',
          admissionYear: ADMIN_STUDENT.admissionYear || new Date().getFullYear(),
          isDSY: ADMIN_STUDENT.isDSY || false,
          branch: ADMIN_STUDENT.branch || 'IT'
        };
        studentsList.push(adminWithPassword);
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
            localStorage.removeItem('selected-student');
          }
        }
      } catch (e) {
        localStorage.removeItem('selected-student');
      }

      setHasInitialized(true);

    } catch (error) {
      console.error('Error loading students:', error);
      const adminWithPassword = {
        ...ADMIN_STUDENT,
        password: bcrypt.hashSync('admin123', 10),
        isProtected: true,
        role: 'admin',
        admissionYear: ADMIN_STUDENT.admissionYear || new Date().getFullYear(),
        isDSY: ADMIN_STUDENT.isDSY || false,
        isYD: ADMIN_STUDENT.isYD || false,
        branch: ADMIN_STUDENT.branch || 'IT'
      };
      setStudents([adminWithPassword]);
      setHasInitialized(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Create new student with optional password and role + admission data
  const createStudent = async (rollNo, name, password = '', role = 'student', admissionYear = (new Date()).getFullYear(), isDSY = false, isYD = false, branch = 'IT', linkedUid = null, email = '', photoURL = '') => {
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
        branch,
        isProtected: !!password,
        password: password ? bcrypt.hashSync(password, 10) : null,
        role: role,
        bio: '',
        email: email || '',
        phone: '',
        github: '',
        linkedin: '',
        website: '',
        photoURL: photoURL || '',
        linkedUid: linkedUid || null
      };

      const exists = students.some(s => s.rollNo === rollNo);
      if (exists) {
        throw new Error('Student with this roll number already exists');
      }

      await setDoc(doc(db, 'students', rollNo), newStudent);
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

      let updatedStudent = { ...student, role: newRole };

      if (newRole === 'co-leader' && !student.permissions) {
        updatedStudent.permissions = {
          canCreateUsers: true,
          canPostNotices: true,
          canAppointCoLeaders: false,
          canManagePasswords: false
        };
      }

      if (newRole === 'student' && student.role === 'co-leader') {
        delete updatedStudent.permissions;
      }

      await setDoc(doc(db, 'students', rollNo), updatedStudent);

      setStudents(students.map(s =>
        s.rollNo === rollNo ? updatedStudent : s
      ));

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

      setStudents(students.map(s =>
        s.rollNo === rollNo ? updatedStudent : s
      ));

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

      setStudents(students.map(s =>
        s.rollNo === rollNo ? updatedStudent : s
      ));

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

  // Update student branch
  const updateStudentBranch = async (rollNo, newBranch) => {
    try {
      if (!newBranch || !newBranch.trim()) {
        throw new Error('Branch cannot be empty');
      }

      const student = students.find(s => s.rollNo === rollNo);
      if (!student) {
        throw new Error('Student not found');
      }

      const updatedStudent = { ...student, branch: newBranch.trim() };
      await setDoc(doc(db, 'students', rollNo), updatedStudent);

      setStudents(students.map(s =>
        s.rollNo === rollNo ? updatedStudent : s
      ));

      if (selectedStudent && selectedStudent.rollNo === rollNo) {
        setSelectedStudent(updatedStudent);
        localStorage.setItem('selected-student', JSON.stringify(updatedStudent));
      }

      return true;
    } catch (error) {
      console.error('Error updating branch:', error);
      throw error;
    }
  };

  // Update student admission year
  const updateStudentAdmissionYear = async (rollNo, newYear) => {
    try {
      const yearNum = Number(newYear);
      if (!Number.isInteger(yearNum) || yearNum < 2000 || yearNum > new Date().getFullYear()) {
        throw new Error('Invalid admission year');
      }

      const student = students.find(s => s.rollNo === rollNo);
      if (!student) {
        throw new Error('Student not found');
      }

      const updatedStudent = { ...student, admissionYear: yearNum };
      await setDoc(doc(db, 'students', rollNo), updatedStudent);

      setStudents(students.map(s =>
        s.rollNo === rollNo ? updatedStudent : s
      ));

      if (selectedStudent && selectedStudent.rollNo === rollNo) {
        setSelectedStudent(updatedStudent);
        localStorage.setItem('selected-student', JSON.stringify(updatedStudent));
      }

      return true;
    } catch (error) {
      console.error('Error updating admission year:', error);
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

      setStudents(students.map(s =>
        s.rollNo === rollNo ? updatedStudent : s
      ));

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
      if (rollNo === ADMIN_STUDENT.rollNo) {
        throw new Error('Cannot delete admin student');
      }

      await deleteDoc(doc(db, 'students', rollNo));

      const batch = writeBatch(db);
      const academicQuery = query(
        collection(db, 'academic-data'),
        where('studentId', '==', rollNo)
      );

      const academicDocs = await getDocs(academicQuery);
      academicDocs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      const notesDoc = doc(db, 'userNotes', rollNo);
      batch.delete(notesDoc);

      await batch.commit();

      setStudents(students.filter(s => s.rollNo !== rollNo));

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
        return true;
      }

      if (!password) {
        return false;
      }

      // Find the full student record if only rollNo is passed
      const fullStudent = student.password
        ? student
        : students.find(s => s.rollNo === student.rollNo);

      if (!fullStudent || !fullStudent.password) return false;

      const isValid = await bcrypt.compare(password, fullStudent.password);
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

      setStudents(students.map(s =>
        s.rollNo === rollNo ? updatedStudent : s
      ));

      if (selectedStudent && selectedStudent.rollNo === rollNo) {
        setSelectedStudent(updatedStudent);
        localStorage.setItem('selected-student', JSON.stringify(updatedStudent));
      }

      return true;
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  };

  // Update student profile fields (bio, contact, links, etc.)
  const updateStudentProfile = async (rollNo, updates) => {
    try {
      const student = students.find(s => s.rollNo === rollNo);
      if (!student) throw new Error('Student not found');

      const updatedStudent = { ...student, ...updates };
      await setDoc(doc(db, 'students', rollNo), updatedStudent);

      setStudents(students.map(s =>
        s.rollNo === rollNo ? updatedStudent : s
      ));

      if (selectedStudent && selectedStudent.rollNo === rollNo) {
        setSelectedStudent(updatedStudent);
        localStorage.setItem('selected-student', JSON.stringify(updatedStudent));
      }

      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
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

      setStudents(students.map(s =>
        s.rollNo === rollNo ? updatedStudent : s
      ));

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

  // Google Sign-In
  const authenticateWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const linkedStudent = students.find(s => s.linkedUid === user.uid);

      if (linkedStudent) {
        return { success: true, student: linkedStudent };
      } else {
        return { success: true, isNewGoogleUser: true, user };
      }
    } catch (error) {
      console.error('Error with Google Auth:', error);
      throw error;
    }
  };

  // Link an existing student profile to a Google account
  const linkStudentWithGoogle = async (rollNo, password, user) => {
    try {
      const isValid = await authenticateStudent({ rollNo }, password);
      if (!isValid) {
        throw new Error('Incorrect password');
      }

      const student = students.find(s => s.rollNo === rollNo);
      if (!student) throw new Error('Student not found');

      const updatedStudent = {
        ...student,
        linkedUid: user.uid,
        email: user.email || student.email,
        photoURL: user.photoURL || student.photoURL
      };

      await setDoc(doc(db, 'students', rollNo), updatedStudent);

      setStudents(students.map(s => s.rollNo === rollNo ? updatedStudent : s));

      if (selectedStudent && selectedStudent.rollNo === rollNo) {
        setSelectedStudent(updatedStudent);
        localStorage.setItem('selected-student', JSON.stringify(updatedStudent));
      }

      return updatedStudent;
    } catch (error) {
      console.error('Error linking Google account:', error);
      throw error;
    }
  };

  // Update student profile photo using Supabase Storage
  const updateStudentPhoto = async (rollNo, file) => {
    try {
      if (!file) throw new Error('No file provided');

      // 1. Cleanup old files first
      const { data: existingFiles } = await supabase.storage
        .from('profile-photos')
        .list(rollNo.toString());

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `${rollNo}/${f.name}`);
        await supabase.storage.from('profile-photos').remove(filesToDelete);
      }

      // 2. Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${rollNo}/avatar_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, {
          upsert: true,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath);

      // 4. Update Firestore
      const student = students.find(s => s.rollNo === rollNo);
      if (!student) throw new Error('Student not found');

      const updatedStudent = { ...student, photoURL: publicUrl };
      await setDoc(doc(db, 'students', rollNo), updatedStudent);

      setStudents(students.map(s =>
        s.rollNo === rollNo ? updatedStudent : s
      ));

      if (selectedStudent && selectedStudent.rollNo === rollNo) {
        setSelectedStudent(updatedStudent);
        localStorage.setItem('selected-student', JSON.stringify(updatedStudent));
      }

      return publicUrl;
    } catch (error) {
      console.error('Error updating photo:', error);
      throw error;
    }
  };

  // Remove student profile photo
  const removeStudentPhoto = async (rollNo) => {
    try {
      const student = students.find(s => s.rollNo === rollNo);
      if (!student) throw new Error('Student not found');
      if (!student.photoURL) return true;

      const { data: existingFiles } = await supabase.storage
        .from('profile-photos')
        .list(rollNo.toString());

      if (existingFiles && existingFiles.length > 0) {
        const filesToDelete = existingFiles.map(f => `${rollNo}/${f.name}`);
        await supabase.storage.from('profile-photos').remove(filesToDelete);
      }

      const updatedStudent = { ...student, photoURL: null };
      await setDoc(doc(db, 'students', rollNo), updatedStudent);

      setStudents(students.map(s =>
        s.rollNo === rollNo ? updatedStudent : s
      ));

      if (selectedStudent && selectedStudent.rollNo === rollNo) {
        setSelectedStudent(updatedStudent);
        localStorage.setItem('selected-student', JSON.stringify(updatedStudent));
      }

      return true;
    } catch (error) {
      console.error('Error removing photo:', error);
      throw error;
    }
  };

  // Select student - clears previous student's local data
  const selectStudent = (student) => {
    const previousStudent = selectedStudent;
    if (previousStudent && previousStudent.rollNo !== student?.rollNo) {
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
    updateStudentBranch,
    updateStudentAdmissionYear,
    updateStudentYD,
    updateStudentPhoto,
    removeStudentPhoto,
    updateStudentProfile,
    authenticateWithGoogle,
    linkStudentWithGoogle,
    loadStudents
  };
}
