import React, { useState, useMemo, useRef } from "react";
import { Star, Users, Plus, Trash2, Crown, User, Loader2, Search, X, Lock, Shield, Key, EyeOff, Eye, UserCheck, UserX, Edit3, Check, ShieldAlert, Camera, Image as ImageIcon, Mail, Phone, Github, Linkedin, Globe, ChevronRight, Quote, Info, GraduationCap, Calendar, Code, ShieldCheck, Copy, ExternalLink, Brain, BarChart3, Cpu, Construction, Settings, BadgeCheck, Bookmark, RefreshCw, AlertTriangle, Sparkles, Zap } from "lucide-react";
import { subjects, ADMIN_STUDENT, BRANCHES } from "../../data/subjects";
import { CustomConfirm } from "../CustomConfirm";
import { toast } from 'react-toastify';
import { AnimatedDropdown } from "../common/AnimatedDropdown";
import { getStudentYear } from "../../utils/studentUtils";

export function StudentManagementTab({
  semester,
  setSemester,
  studentManagement
}) {
  const {
    students,
    selectedStudent,
    isAdmin,
    isLoading,
    createStudent,
    deleteStudent,
    selectStudent,
    authenticateStudent,
    updateStudentPassword,
    updateStudentRole,
    updateStudentName,
    updateStudentDSY,
    updateStudentAdmissionYear,
    updateStudentYD,
    updateStudentBranch,
    updateStudentPhoto,
    removeStudentPhoto,
    updateStudentProfile
  } = studentManagement;

  // Check if current user is a co-leader with permissions
  const isCoLeader = selectedStudent?.role === 'co-leader' &&
    selectedStudent?.rollNo !== ADMIN_STUDENT.rollNo;
  const coLeaderPermissions = selectedStudent?.permissions || {};

  // Permission checks
  const canCreateUsers = isAdmin || (isCoLeader && coLeaderPermissions.canCreateUsers);
  const canAppointCoLeaders = isAdmin || (isCoLeader && coLeaderPermissions.canAppointCoLeaders);

  const [isDeleting, setIsDeleting] = useState(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Name edit states
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  // Admission year edit states
  const [isEditingYear, setIsEditingYear] = useState(false);
  const [tempYear, setTempYear] = useState("");
  const [isSavingYear, setIsSavingYear] = useState(false);

  // Branch edit states
  const [isEditingBranch, setIsEditingBranch] = useState(false);
  const [tempBranch, setTempBranch] = useState("");
  const [isSavingBranch, setIsSavingBranch] = useState(false);

  // Photo management states
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isRemovingPhoto, setIsRemovingPhoto] = useState(false);
  const fileInputRef = useRef(null);

  // Profile editing states
  const [editingField, setEditingField] = useState(null); // 'bio', 'email', 'phone', 'github', 'linkedin', 'website'
  const [tempValue, setTempValue] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  // Admin authentication states
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState("");

  // Student authentication modal states for protected students
  const [showStudentAuth, setShowStudentAuth] = useState(false);
  const [studentAuthPassword, setStudentAuthPassword] = useState("");
  const [studentAuthError, setStudentAuthError] = useState("");
  const [studentToAuthenticate, setStudentToAuthenticate] = useState(null);
  const [isStudentAuthenticating, setIsStudentAuthenticating] = useState(false);

  // Password change states
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordChangeStudent, setPasswordChangeStudent] = useState(null);
  const [newPasswordData, setNewPasswordData] = useState({ password: '', confirmPassword: '' });

  // Custom confirmation states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmColor: 'red',
    icon: 'warning',
    onConfirm: () => { }
  });

  const ADMIN_PASSWORD = "admin123"; // Should match the one in StudentSelectionScreen

  // Profile views management
  const [viewedStudent, setViewedStudent] = useState(selectedStudent);

  // Branch icons mapping
  const getBranchIcon = (branch) => {
    switch (branch) {
      case 'AIML': return Brain;
      case 'IT': return Code;
      case 'DS': return BarChart3;
      case 'Computer Engineering': return Cpu;
      case 'Civil': return Construction;
      case 'Mechanical': return Settings;
      default: return Globe;
    }
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} to clipboard!`, {
      position: "bottom-right",
      autoClose: 2000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: false,
      theme: "dark",
    });
  };

  // Color helpers for dynamic stat cards
  const statColorMap = {
    blue: { bg: '#eff6ff', border: '#dbeafe80', iconBg: '#ffffff', iconBorder: '#dbeafe', iconText: '#2563eb', label: '#2563eb', value: '#1e3a5f', hoverBg: '#eff6ff', hoverShadow: 'rgba(59,130,246,0.05)' },
    indigo: { bg: '#eef2ff', border: '#e0e7ff80', iconBg: '#ffffff', iconBorder: '#e0e7ff', iconText: '#4f46e5', label: '#4f46e5', value: '#312e81', hoverBg: '#eef2ff', hoverShadow: 'rgba(79,70,229,0.05)' },
    emerald: { bg: '#ecfdf5', border: '#d1fae580', iconBg: '#ffffff', iconBorder: '#d1fae5', iconText: '#059669', label: '#059669', value: '#064e3b', hoverBg: '#ecfdf5', hoverShadow: 'rgba(5,150,105,0.05)' },
    orange: { bg: '#fff7ed', border: '#ffedd580', iconBg: '#ffffff', iconBorder: '#ffedd5', iconText: '#ea580c', label: '#ea580c', value: '#7c2d12', hoverBg: '#fff7ed', hoverShadow: 'rgba(234,88,12,0.05)' },
    red: { bg: '#fef2f2', border: '#fecaca80', iconBg: '#ffffff', iconBorder: '#fecaca', iconText: '#dc2626', label: '#dc2626', value: '#7f1d1d', hoverBg: '#fef2f2', hoverShadow: 'rgba(220,38,38,0.05)' },
  };

  // Role-based gradient config
  const getRoleTheme = (student) => {
    if (student?.rollNo === ADMIN_STUDENT.rollNo) return { gradient: 'from-amber-500 via-orange-400 to-yellow-500', glow: 'amber', accent: '#f59e0b' };
    if (student?.role === 'co-leader') return { gradient: 'from-purple-600 via-fuchsia-500 to-pink-500', glow: 'fuchsia', accent: '#d946ef' };
    return { gradient: 'from-blue-600 via-indigo-500 to-sky-400', glow: 'blue', accent: '#3b82f6' };
  };

  // Keep viewed student in sync when the session student changes (e.g. from header)
  React.useEffect(() => {
    if (selectedStudent && (!viewedStudent || (viewedStudent.rollNo === selectedStudent.rollNo))) {
      setViewedStudent(selectedStudent);
    }
  }, [selectedStudent]);

  // Filter students based on search query and branch
  const filteredStudents = useMemo(() => {
    let result = students;

    // show only own branch for non-admins, but ALWAYS include the Super Admin (General branch)
    if (!isAdmin && selectedStudent?.branch) {
      result = result.filter(s =>
        s.branch === selectedStudent.branch ||
        s.rollNo === ADMIN_STUDENT.rollNo
      );
    }

    if (!searchQuery.trim()) return result;

    const query = searchQuery.toLowerCase();
    return result.filter(student =>
      student.name.toLowerCase().includes(query) ||
      student.rollNo.toLowerCase().includes(query)
    );
  }, [students, searchQuery, isAdmin, isCoLeader, selectedStudent?.branch]);

  const handleStartEditName = () => {
    setTempName(selectedStudent.name);
    setIsEditingName(true);
  };

  const handleCancelEditName = () => {
    setIsEditingName(false);
    setTempName("");
  };

  const handleSaveName = async () => {
    if (!tempName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    try {
      setIsSavingName(true);
      await updateStudentName(selectedStudent.rollNo, tempName);
      toast.success("✅ Name updated successfully!");
      setIsEditingName(false);
    } catch (error) {
      toast.error(`❌ Error updating name: ${error.message}`);
    } finally {
      setIsSavingName(false);
    }
  };

  const handleStartEditYear = () => {
    setTempYear(selectedStudent.admissionYear?.toString() || "");
    setIsEditingYear(true);
  };

  const handleCancelEditYear = () => {
    setIsEditingYear(false);
    setTempYear("");
  };

  const handleSaveYear = async () => {
    const yearNum = Number(tempYear);
    const currentYear = new Date().getFullYear();

    if (!tempYear || !Number.isInteger(yearNum) || yearNum < 2000 || yearNum > currentYear) {
      toast.error("Please enter a valid admission year");
      return;
    }

    try {
      setIsSavingYear(true);
      await updateStudentAdmissionYear(selectedStudent.rollNo, yearNum);
      toast.success("✅ Admission year updated successfully!");
      setIsEditingYear(false);
    } catch (error) {
      toast.error(`❌ Error updating admission year: ${error.message}`);
    } finally {
      setIsSavingYear(false);
    }
  };

  const handleStartEditBranch = () => {
    setTempBranch(selectedStudent.branch || "General");
    setIsEditingBranch(true);
  };

  const handleCancelEditBranch = () => {
    setIsEditingBranch(false);
    setTempBranch("");
  };

  const handleSaveBranch = async () => {
    if (!tempBranch.trim()) {
      toast.error("Branch cannot be empty");
      return;
    }
    try {
      setIsSavingBranch(true);
      await updateStudentBranch(selectedStudent.rollNo, tempBranch);
      toast.success("✅ Branch updated successfully!");
      setIsEditingBranch(false);
    } catch (error) {
      toast.error(`❌ Error updating branch: ${error.message}`);
    } finally {
      setIsSavingBranch(false);
    }
  };

  const handleStartEditProfile = (field, value) => {
    setEditingField(field);
    setTempValue(value || "");
  };

  const handleCancelEditProfile = () => {
    setEditingField(null);
    setTempValue("");
  };

  const handleSaveProfile = async () => {
    try {
      setIsSavingProfile(true);
      let finalValue = tempValue;
      if (typeof tempValue === 'string') finalValue = tempValue.trim();
      
      if (editingField === 'admissionYear') {
          await updateStudentAdmissionYear(selectedStudent.rollNo, Number(finalValue));
          finalValue = Number(finalValue);
      } else {
          await updateStudentProfile(selectedStudent.rollNo, { [editingField]: finalValue });
      }
      
      setViewedStudent(prev => ({
        ...prev,
        [editingField]: finalValue
      }));
      setEditingField(null);
      setTempValue("");
      toast.success(`✅ Profile updated!`);
    } catch (error) {
      toast.error(`❌ Error updating profile: ${error.message}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const showConfirm = (config) => {
    setConfirmConfig(config);
    setConfirmOpen(true);
  };

  const handleConfirm = () => {
    confirmConfig.onConfirm();
    setConfirmOpen(false);
  };

  const handleCancel = () => {
    setConfirmOpen(false);
  };

  const handleViewProfile = (student) => {
    setViewedStudent(student);
    // Smooth scroll to profile board
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStudentClick = async (student) => {
    // Now just viewing
    handleViewProfile(student);
  };

  const handleSwitchAccount = async (student) => {
    // Check if trying to select admin student and current user is not admin
    if (student.rollNo === ADMIN_STUDENT.rollNo && selectedStudent?.rollNo !== ADMIN_STUDENT.rollNo) {
      setShowAdminAuth(true);
      setAuthError("");
      return;
    }

    // Check if student is password protected (non-admin)
    if (student.isProtected && student.rollNo !== selectedStudent?.rollNo) {
      // Open password modal for this student
      setStudentToAuthenticate(student);
      setStudentAuthPassword("");
      setStudentAuthError("");
      setShowStudentAuth(true);
      return;
    }

    // Proceed with selection
    selectStudent(student);
    toast.success(`Logged in as ${student.name}`);
  };

  const handleAdminAuth = async (e) => {
    e.preventDefault();

    if (!adminPassword.trim()) {
      setAuthError('Please enter admin password');
      return;
    }

    setIsAuthenticating(true);
    setAuthError("");

    // Simulate auth delay for better UX
    setTimeout(async () => {
      const adminStudent = students.find(s => s.rollNo === ADMIN_STUDENT.rollNo);
      const isValid = await authenticateStudent(adminStudent, adminPassword);

      if (isValid) {
        selectStudent(adminStudent);
        setShowAdminAuth(false);
        setAdminPassword("");
      } else {
        setAuthError('Incorrect admin password. Please try again.');
        setAdminPassword("");
      }
      setIsAuthenticating(false);
    }, 800);
  };

  // Student authentication (for password-protected non-admin students)
  const handleStudentAuth = async (e) => {
    e.preventDefault();

    if (!studentAuthPassword.trim()) {
      setStudentAuthError('Please enter password');
      return;
    }

    setIsStudentAuthenticating(true);
    setStudentAuthError("");

    try {
      const isValid = await authenticateStudent(studentToAuthenticate, studentAuthPassword);
      if (isValid) {
        selectStudent(studentToAuthenticate);
        setShowStudentAuth(false);
        setStudentToAuthenticate(null);
        setStudentAuthPassword("");
      } else {
        setStudentAuthError('Incorrect password. Please try again.');
        setStudentAuthPassword("");
      }
    } catch (err) {
      setStudentAuthError('Authentication failed. Please try again.');
    } finally {
      setIsStudentAuthenticating(false);
    }
  };

  const cancelStudentAuth = () => {
    setShowStudentAuth(false);
    setStudentToAuthenticate(null);
    setStudentAuthPassword("");
    setStudentAuthError("");
  };

  const cancelAdminAuth = () => {
    setShowAdminAuth(false);
    setAdminPassword("");
    setAuthError("");
  };



  const handleDeleteStudent = async (rollNo, name) => {
    if (rollNo === ADMIN_STUDENT.rollNo) {
      toast.error('Cannot delete admin student');
      return;
    }

    showConfirm({
      title: 'Delete Student',
      message: `Are you sure you want to delete "${name}" (${rollNo})?\n\nThis will permanently delete all their academic data and cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      confirmColor: 'red',
      icon: 'danger',
      onConfirm: async () => {
        try {
          setIsDeleting(rollNo);
          await deleteStudent(rollNo);
          toast.success('✅ Student deleted successfully!');
        } catch (error) {
          toast.error(`❌ Error deleting student: ${error.message}`);
        } finally {
          setIsDeleting(null);
        }
      }
    });
  };

  const handleRoleChange = async (student, newRole) => {
    if (student.rollNo === ADMIN_STUDENT.rollNo) {
      toast.error('Cannot change admin role');
      return;
    }

    const roleNames = {
      'student': 'Student',
      'co-leader': 'Co-Leader'
    };

    showConfirm({
      title: 'Change Role',
      message: `Change ${student.name}'s role to ${roleNames[newRole]}?\n\n${newRole === 'co-leader' ? 'Co-leaders can create and manage notices.' : 'Students have standard access only.'}`,
      confirmText: 'Change Role',
      cancelText: 'Cancel',
      confirmColor: 'blue',
      icon: 'warning',
      onConfirm: async () => {
        try {
          setIsUpdatingRole(student.rollNo);
          await updateStudentRole(student.rollNo, newRole);
          toast.success(`✅ ${student.name}'s role updated to ${roleNames[newRole]}!`);
        } catch (error) {
          toast.error(`❌ Error updating role: ${error.message}`);
        } finally {
          setIsUpdatingRole(null);
        }
      }
    });
  };

  const handlePasswordChange = (student) => {
    setPasswordChangeStudent(student);
    setShowPasswordChange(true);
    setNewPasswordData({ password: '', confirmPassword: '' });
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (newPasswordData.password !== newPasswordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (!newPasswordData.password.trim()) {
      toast.error('Please enter a password');
      return;
    }

    try {
      const wasProtected = passwordChangeStudent?.isProtected;
      await updateStudentPassword(passwordChangeStudent.rollNo, newPasswordData.password);
      setShowPasswordChange(false);
      setPasswordChangeStudent(null);
      if (wasProtected) {
        toast.success('✅ Password updated successfully!');
      } else {
        toast.success('✅ Password added successfully!');
      }
    } catch (error) {
      toast.error(`❌ Error updating password: ${error.message}`);
    }
  };

  const handleRemovePassword = async (student) => {
    showConfirm({
      title: 'Remove Password Protection',
      message: `Remove password protection from ${student.name}?\n\nThis will allow unrestricted access to their account.`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      confirmColor: 'orange',
      icon: 'warning',
      onConfirm: async () => {
        try {
          await updateStudentPassword(student.rollNo, '', true);
          toast.success('✅ Password protection removed!');
        } catch (error) {
          toast.error(`❌ Error removing password: ${error.message}`);
        }
      }
    });
  };

  const handleToggleYD = async (student, e) => {
    e.stopPropagation();
    try {
      const newVal = !student.isYD;
      await updateStudentYD(student.rollNo, newVal);
      toast.success(`✅ ${student.name} marked as ${newVal ? 'Year Drop' : 'no Year Drop'}`);
    } catch (error) {
      toast.error(`❌ Error updating YD: ${error.message}`);
    }
  };

  const handleToggleDSY = async (student, e) => {
    e.stopPropagation();
    try {
      const newVal = !student.isDSY;
      await updateStudentDSY(student.rollNo, newVal);
      toast.success(`✅ ${student.name} marked as ${newVal ? 'DSY' : 'non-DSY'}`);
    } catch (error) {
      toast.error(`❌ Error updating DSY: ${error.message}`);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds 10MB limit");
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    try {
      setIsUploadingPhoto(true);
      await updateStudentPhoto(selectedStudent.rollNo, file);
      toast.success("✅ Profile photo updated!");
    } catch (error) {
      toast.error(`❌ Upload failed: ${error.message}`);
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    showConfirm({
      title: 'Remove Photo',
      message: 'Are you sure you want to remove your profile photo?',
      confirmText: 'Remove',
      cancelText: 'Cancel',
      confirmColor: 'red',
      icon: 'warning',
      onConfirm: async () => {
        try {
          setIsRemovingPhoto(true);
          await removeStudentPhoto(selectedStudent.rollNo);
          toast.success("✅ Profile photo removed!");
        } catch (error) {
          toast.error(`❌ Error removing photo: ${error.message}`);
        } finally {
          setIsRemovingPhoto(false);
        }
      }
    });
  };
  const clearSearch = () => {
    setSearchQuery("");
  };

  const getRoleDisplay = (role) => {
    switch (role) {
      case 'admin': return { name: 'Admin', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Crown };
      case 'co-leader': return { name: 'Co-Leader', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: Star };
      default: return { name: 'Student', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: User };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600">Loading students...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Custom Confirmation Dialog */}
      <CustomConfirm
        open={confirmOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        confirmColor={confirmConfig.confirmColor}
        icon={confirmConfig.icon}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      {/* Admin Authentication Modal */}
      {showAdminAuth && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Authentication</h2>
              <p className="text-gray-600">Enter admin password to switch to {ADMIN_STUDENT.name}</p>
            </div>

            <form onSubmit={handleAdminAuth} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  placeholder="Admin password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                  disabled={isAuthenticating}
                  autoFocus
                />
              </div>

              {authError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {authError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isAuthenticating || !adminPassword.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isAuthenticating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <Crown className="w-4 h-4" />
                      <span>Switch to Admin</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={cancelAdminAuth}
                  disabled={isAuthenticating}
                  className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Authentication Modal */}
      {showStudentAuth && studentToAuthenticate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Authentication</h2>
              <p className="text-gray-600">Enter password to access {studentToAuthenticate.name}'s account</p>
            </div>

            <form onSubmit={handleStudentAuth} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={studentAuthPassword}
                  onChange={(e) => setStudentAuthPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  disabled={isStudentAuthenticating}
                  autoFocus
                />
              </div>

              {studentAuthError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {studentAuthError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isStudentAuthenticating || !studentAuthPassword.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isStudentAuthenticating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Access Account</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={cancelStudentAuth}
                  disabled={isStudentAuthenticating}
                  className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Password Change Modal */}
      {showPasswordChange && passwordChangeStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{passwordChangeStudent?.isProtected ? 'Change Password' : 'Add Password'}</h2>
              <p className="text-gray-600">Set new password for {passwordChangeStudent.name}</p>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  placeholder="New password"
                  value={newPasswordData.password}
                  onChange={(e) => setNewPasswordData({ ...newPasswordData, password: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  autoFocus
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={newPasswordData.confirmPassword}
                  onChange={(e) => setNewPasswordData({ ...newPasswordData, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all font-medium"
                >
                  <Key className="w-4 h-4" />
                  <span>{passwordChangeStudent?.isProtected ? 'Update Password' : 'Set Password'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPasswordChange(false)}
                  className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Profile Page</h2>
        <p className="text-sm sm:text-base text-gray-600">Personal Academic Portfolio & Institutional Identity</p>
      </div>

      {/* Profile Card Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6 mt-4 relative group/profile">
        {/* Top Color Accent */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${getRoleTheme(viewedStudent).gradient}`} />
        
        {/* Profile Card Header (Horizontal) */}
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 border-b border-gray-100">
          
          {/* Avatar */}
          <div className="relative group/photo shrink-0">
            <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-br ${getRoleTheme(viewedStudent).gradient}`}>
              <div className="w-full h-full bg-white rounded-full overflow-hidden relative">
                {viewedStudent?.photoURL ? (
                  <img src={viewedStudent.photoURL} alt={viewedStudent.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-50">
                    <User className="w-12 h-12 text-gray-300" />
                  </div>
                )}
                
                {/* Photo Action Overlay */}
                {(isAdmin || selectedStudent?.rollNo === viewedStudent?.rollNo) && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                    <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-colors" title="Change Photo">
                      <Camera className="w-4 h-4" />
                    </button>
                    {viewedStudent?.photoURL && (
                      <button onClick={handleRemovePhoto} className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white transition-colors" title="Remove Photo">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
                {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                )}
              </div>
            </div>
            {/* Online Status */}
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
              <div className="flex items-center gap-3">
                {isEditingName && (isAdmin || selectedStudent?.rollNo === viewedStudent?.rollNo) ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tempName}
                      onChange={(e) => setTempName(e.target.value)}
                      className="px-3 py-1.5 text-xl font-bold border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full max-w-[200px]"
                      autoFocus
                    />
                    <button onClick={handleSaveName} className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 shrink-0">
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group/name">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 truncate">{viewedStudent?.name}</h2>
                    {(isAdmin || selectedStudent?.rollNo === viewedStudent?.rollNo) && (
                      <button onClick={handleStartEditName} className="p-1.5 text-gray-400 hover:text-blue-600 opacity-0 group-hover/name:opacity-100 transition-opacity rounded-lg">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {selectedStudent?.rollNo === viewedStudent?.rollNo ? (
                  <div className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-lg flex items-center gap-1.5 border border-green-100">
                    <Check className="w-3.5 h-3.5" /> Active Profile
                  </div>
                ) : (
                  <>
                    <button onClick={() => handleSwitchAccount(viewedStudent)} className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors">
                      <Lock className="w-3.5 h-3.5" /> Login As
                    </button>
                    <button onClick={() => setViewedStudent(selectedStudent)} className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Return to My Profile">
                      <X className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-1 text-xs font-medium rounded-md border flex items-center gap-1.5 ${viewedStudent?.rollNo === ADMIN_STUDENT.rollNo ? 'bg-amber-50 text-amber-700 border-amber-200' : viewedStudent?.role === 'co-leader' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                {viewedStudent?.rollNo === ADMIN_STUDENT.rollNo ? <Crown className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                {viewedStudent?.rollNo === ADMIN_STUDENT.rollNo ? 'Admin' : viewedStudent?.role === 'co-leader' ? 'Co-Leader' : 'Student'}
              </span>
              <span className="px-2.5 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-md font-mono flex items-center gap-1.5">
                ID: {viewedStudent?.rollNo}
                <button onClick={() => copyToClipboard(viewedStudent?.rollNo, 'ID')} className="text-gray-400 hover:text-gray-600">
                  <Copy className="w-3 h-3" />
                </button>
              </span>
            </div>
          </div>
        </div>

        {/* Profile Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x border-gray-100">
          
          {/* Main Column: About & Academic */}
          <div className="lg:col-span-2 p-6 sm:p-8">
            {/* About Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                  <User className="w-4 h-4" /> About
                </h3>
                {!editingField && (isAdmin || selectedStudent?.rollNo === viewedStudent?.rollNo) && (
                  <button onClick={() => handleStartEditProfile('bio', viewedStudent?.bio)} className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md">
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                )}
              </div>
              
              {editingField === 'bio' ? (
                <div className="space-y-3">
                  <textarea
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    placeholder="Add your bio..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[100px]"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={handleCancelEditProfile} className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-md">Cancel</button>
                    <button onClick={handleSaveProfile} disabled={isSavingProfile} className="px-4 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2">
                      {isSavingProfile && <Loader2 className="w-3 h-3 animate-spin" />} Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className={`text-sm leading-relaxed ${viewedStudent?.bio ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                  {viewedStudent?.bio || "No bio added yet."}
                </p>
              )}
            </div>

            {/* Academic Info */}
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2 mb-4">
                <GraduationCap className="w-4 h-4" /> Academic Details
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { id: 'academicYear', label: 'Year', value: getStudentYear(viewedStudent), icon: GraduationCap },
                  { id: 'admissionYear', label: 'Admitted', value: viewedStudent?.admissionYear, icon: Calendar, editable: true },
                  { id: 'branch', label: 'Branch', value: viewedStudent?.branch || 'General', icon: getBranchIcon(viewedStudent?.branch) },
                  { id: 'isDSY', label: 'Entry', value: viewedStudent?.isDSY ? 'DSY' : 'Regular', icon: Bookmark, toggle: handleToggleDSY },
                  { id: 'isYD', label: 'Status', value: viewedStudent?.isYD ? 'Year Drop' : 'Active', icon: AlertTriangle, toggle: handleToggleYD }
                ].map((stat, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 border border-gray-100 rounded-xl relative group/stat">
                    <div className="flex items-center gap-2 mb-1 text-gray-500">
                      <stat.icon className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">{stat.label}</span>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm truncate">{stat.value}</p>
                    
                    {(isAdmin || selectedStudent?.rollNo === viewedStudent?.rollNo) && stat.editable && (
                      <button onClick={() => handleStartEditProfile(stat.id, viewedStudent?.[stat.id])} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover/stat:opacity-100 transition-opacity bg-white rounded shadow-sm border border-gray-200">
                        <Edit3 className="w-3 h-3" />
                      </button>
                    )}
                    {(isAdmin || selectedStudent?.rollNo === viewedStudent?.rollNo) && stat.toggle && (
                      <button onClick={(e) => {
                        stat.toggle(viewedStudent, e);
                        setViewedStudent(prev => ({ ...prev, [stat.id]: !prev[stat.id] }));
                      }} className="absolute top-2 right-2 p-1 text-gray-400 hover:text-blue-600 opacity-0 group-hover/stat:opacity-100 transition-opacity bg-white rounded shadow-sm border border-gray-200">
                        <RefreshCw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Side Column: Contact & Links */}
          <div className="p-6 sm:p-8 bg-gray-50/50">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4" /> Contact & Links
            </h3>
            
            <div className="space-y-3">
              {[
                { id: 'email', icon: Mail, label: 'Email', value: viewedStudent?.email },
                { id: 'phone', icon: Phone, label: 'Phone', value: viewedStudent?.phone },
                { id: 'linkedin', icon: Linkedin, label: 'LinkedIn', value: viewedStudent?.linkedin },
                { id: 'github', icon: Github, label: 'GitHub', value: viewedStudent?.github },
                { id: 'website', icon: Globe, label: 'Website', value: viewedStudent?.website }
              ].map(field => (
                <div key={field.id} className="group/field flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-md bg-gray-100 text-gray-500 flex items-center justify-center shrink-0">
                      <field.icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-500 font-medium uppercase">{field.label}</p>
                      {field.value ? (
                        field.id === 'email' || field.id === 'phone' ? (
                          <p className="text-sm font-medium text-gray-900 truncate">{field.value}</p>
                        ) : (
                          <a href={field.value.startsWith('http') ? field.value : `https://${field.value}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline truncate flex items-center gap-1">
                            {field.value.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        )
                      ) : (
                        <p className="text-sm text-gray-400 italic">Not provided</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/field:opacity-100 transition-opacity">
                    {field.value && (
                      <button onClick={() => copyToClipboard(field.value, field.label)} className="p-1.5 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded">
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                    {(isAdmin || selectedStudent?.rollNo === viewedStudent?.rollNo) && (
                      <button onClick={() => handleStartEditProfile(field.id, field.value)} className="p-1.5 text-gray-400 hover:text-blue-600 bg-gray-100 hover:bg-blue-50 rounded">
                        <Edit3 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Account Security Section */}
            {(isAdmin || selectedStudent?.rollNo === viewedStudent?.rollNo) && (
              <div className="mt-8">
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-4 h-4" /> Account Security
                </h3>
                
                <div className="space-y-3">
                  <button 
                    onClick={() => { setPasswordChangeStudent(viewedStudent); setShowPasswordChange(true); }}
                    className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-colors group/security"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Key className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-gray-500 font-medium uppercase">Password</p>
                        <p className="text-sm font-bold text-gray-900">{viewedStudent?.isProtected ? 'Update Password' : 'Set Password'}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover/security:text-gray-600 transition-colors" />
                  </button>

                  <button 
                    onClick={async () => {
                      if (!viewedStudent.linkedUid) {
                        try {
                          const result = await studentManagement.authenticateWithGoogle();
                          if (result.user) {
                            // Link bypassing password check for logged in user
                            const updatedStudent = { 
                              ...viewedStudent, 
                              linkedUid: result.user.uid,
                              email: result.user.email || viewedStudent.email,
                              photoURL: result.user.photoURL || viewedStudent.photoURL 
                            };
                            await studentManagement.updateStudentProfile(viewedStudent.rollNo, updatedStudent);
                            toast.success("Google account linked successfully!");
                          }
                        } catch (e) {
                          toast.error(e.message || "Failed to link Google account");
                        }
                      }
                    }}
                    disabled={!!viewedStudent?.linkedUid}
                    className={`w-full flex items-center justify-between p-3 bg-white border rounded-lg transition-colors group/security ${viewedStudent?.linkedUid ? 'border-green-200 opacity-80 cursor-default' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-md flex items-center justify-center shrink-0 ${viewedStudent?.linkedUid ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                        {viewedStudent?.linkedUid ? <Check className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </div>
                      <div className="text-left">
                        <p className="text-xs text-gray-500 font-medium uppercase">Google Auth</p>
                        <p className={`text-sm font-bold ${viewedStudent?.linkedUid ? 'text-green-700' : 'text-gray-900'}`}>
                          {viewedStudent?.linkedUid ? 'Linked' : 'Link Google Account'}
                        </p>
                      </div>
                    </div>
                    {!viewedStudent?.linkedUid && <ChevronRight className="w-4 h-4 text-gray-400 group-hover/security:text-gray-600 transition-colors" />}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editing Overlay Modal for Small Fields */}
      {editingField && editingField !== 'bio' && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
            <h4 className="text-lg font-bold text-gray-900 mb-1 capitalize">Edit {editingField}</h4>
            <p className="text-sm text-gray-500 mb-4">Update your {editingField === 'website' ? 'URL' : editingField} information.</p>

            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {editingField === 'email' && <Mail className="w-5 h-5 text-gray-400" />}
                  {editingField === 'phone' && <Phone className="w-5 h-5 text-gray-400" />}
                  {editingField === 'github' && <Github className="w-5 h-5 text-gray-400" />}
                  {editingField === 'linkedin' && <Linkedin className="w-5 h-5 text-gray-400" />}
                  {editingField === 'website' && <Globe className="w-5 h-5 text-gray-400" />}
                  {editingField === 'admissionYear' && <Calendar className="w-5 h-5 text-gray-400" />}
                </div>
                <input
                  type={editingField === 'email' ? 'email' : editingField === 'phone' ? 'tel' : editingField === 'admissionYear' ? 'number' : 'text'}
                  value={tempValue}
                  onChange={(e) => setTempValue(e.target.value)}
                  placeholder={`Enter ${editingField}...`}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveProfile();
                    if (e.key === 'Escape') handleCancelEditProfile();
                  }}
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={handleCancelEditProfile}
                  className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  {isSavingProfile && <Loader2 className="w-4 h-4 animate-spin" />}
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Semester Management Section */}
      <div className="bg-white rounded-[2rem] shadow-xl p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900">Academic Progression</h3>
              <p className="text-sm text-gray-500 font-medium">Select your current semester to view specific subjects.</p>
            </div>
          </div>
          <div className="hidden sm:block text-right">
            <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Academic Year</div>
            <div className="text-sm font-bold text-gray-900 flex items-center gap-1.5 justify-end mt-0.5">
              <Calendar className="w-4 h-4 text-blue-500" />
              {(() => {
                const now = new Date();
                const year = now.getFullYear();
                const startYear = now.getMonth() >= 5 ? year : year - 1;
                return `${startYear}-${(startYear + 1).toString().slice(-2)}`;
              })()}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <AnimatedDropdown
              options={(selectedStudent?.isDSY ? [3, 4, 5, 6, 7, 8] : [1, 2, 3, 4, 5, 6, 7, 8]).map(sem => ({
                value: sem,
                label: `Semester ${sem}`,
                description: `${subjects[sem].theory.length} theory + ${subjects[sem].practical.length} practical`,
                icon: Star,
                iconColor: 'text-blue-500',
                iconBg: 'bg-blue-50'
              }))}
              value={semester}
              onChange={(val) => setSemester(Number(val))}
              placeholder="Select Semester"
            />
          </div>
          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 flex flex-col justify-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-xs font-black">
                {semester}
              </div>
              <div>
                <p className="text-xs font-black text-blue-900 uppercase tracking-tighter">Current Sync</p>
                <p className="text-[10px] text-blue-700 font-bold">{subjects[semester].theory.length} Theory • {subjects[semester].practical.length} Lab</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Selection */}
      <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">
                {isAdmin || isCoLeader ? `Student Directory (${filteredStudents.length})` : `Classmates & Peers`}
              </h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                {isAdmin || isCoLeader ? 'Managing All Branches' : `Branch: ${selectedStudent?.branch || 'General'}`}
              </p>
            </div>
          </div>

        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder={isAdmin || isCoLeader ? "Search students globally..." : `Search classmates in ${selectedStudent?.branch || 'General'}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
            </button>
          )}
        </div>


        {/* Co-Leader note about limited creation permissions */}
        {isCoLeader && canCreateUsers && !isAdmin && (
          <div className="mb-4 p-3 bg-purple-50 rounded-xl border border-purple-200">
            <p className="text-sm text-purple-700">
              <Star className="w-4 h-4 inline mr-1" />
              As a co-leader, you can create new student accounts with your granted permissions.
            </p>
          </div>
        )}

        {/* Student List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => {
              const roleDisplay = getRoleDisplay(student.role || 'student');

              return (
                <div
                  key={student.rollNo}
                  className={`
                    p-5 rounded-[2rem] border-2 transition-all cursor-pointer relative group/item overflow-hidden
                    ${selectedStudent?.rollNo === student.rollNo
                      ? student.rollNo === ADMIN_STUDENT.rollNo
                        ? 'border-amber-400 bg-amber-50 shadow-xl shadow-amber-500/10'
                        : student.role === 'co-leader'
                          ? 'border-purple-400 bg-purple-50 shadow-xl shadow-purple-500/10'
                          : 'border-blue-400 bg-blue-50 shadow-xl shadow-blue-500/10'
                      : 'border-gray-100 bg-white hover:border-blue-200 hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-1'
                    }
                  `}
                  onClick={() => handleViewProfile(student)}
                >
                  {/* Selection Indicator */}
                  {selectedStudent?.rollNo === student.rollNo && (
                    <div className="absolute top-4 right-4 z-20">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
                    </div>
                  )}

                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={`w-14 h-14 rounded-2xl overflow-hidden border-2 flex-shrink-0 flex items-center justify-center p-0.5 transition-transform group-hover/item:scale-105
                          ${student.rollNo === ADMIN_STUDENT.rollNo ? 'border-amber-300' : student.role === 'co-leader' ? 'border-purple-300' : 'border-blue-300'}
                          ${selectedStudent?.rollNo === student.rollNo ? 'bg-white' : 'bg-gray-50'}
                        `}>
                          {student.photoURL ? (
                            <img src={student.photoURL} alt={student.name} className="w-full h-full object-cover rounded-[14px]" />
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center rounded-[14px] ${student.rollNo === ADMIN_STUDENT.rollNo ? 'bg-amber-50' : 'bg-blue-50'}`}>
                              <User className={`w-6 h-6 ${student.rollNo === ADMIN_STUDENT.rollNo ? 'text-amber-500' : 'text-blue-500'}`} />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-black text-gray-900 truncate leading-tight">{student.name}</h4>
                            {React.createElement(roleDisplay.icon, {
                              className: `w-3.5 h-3.5 ${roleDisplay.color} drop-shadow-sm`
                            })}
                          </div>
                          <p className="text-[10px] font-black text-gray-400 font-mono tracking-widest uppercase mb-1">ID: {student.rollNo}</p>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${student.rollNo === ADMIN_STUDENT.rollNo
                              ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
                              : student.role === 'co-leader'
                                ? 'text-purple-700 bg-purple-50 border-purple-200'
                                : 'text-blue-700 bg-blue-50 border-blue-200'
                              }`}>
                              {getStudentYear(student)}
                            </span>
                          </div>
                        </div>
                      </div>



                      {/* Role Badge */}
                      <div className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${roleDisplay.bgColor} mb-1 block w-fit`}>
                        <span className={roleDisplay.color}>{roleDisplay.name}</span>
                      </div>

                      {/* DSY & YD badges + toggle (admin only, non-admin students) */}
                      {isAdmin && student.rollNo !== ADMIN_STUDENT.rollNo && (
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <button
                            onClick={(e) => handleToggleDSY(student, e)}
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${student.isDSY
                              ? 'bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-200'
                              : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
                              }`}
                            title="Toggle DSY status"
                          >
                            {student.isDSY ? '✓ DSY' : 'Non-DSY'}
                          </button>

                          <button
                            onClick={(e) => handleToggleYD(student, e)}
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${student.isYD
                              ? 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200'
                              : 'bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200'
                              }`}
                            title="Toggle Year Drop (YD) status"
                          >
                            {student.isYD ? '✓ Year Drop' : 'No YD'}
                          </button>
                        </div>
                      )}

                      <div className="mt-1 flex flex-wrap gap-1.5 min-h-[1.5rem]">
                        <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg border bg-blue-50/50 text-blue-600 border-blue-100 uppercase tracking-tighter">
                          {student.branch || 'General'}
                        </span>
                        {student.isProtected && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-lg border bg-indigo-50 text-indigo-600 border-indigo-100 uppercase tracking-tighter">
                            <Lock className="w-2.5 h-2.5" /> Locked
                          </span>
                        )}
                      </div>

                      <div className="mt-3">
                        {selectedStudent?.rollNo === student.rollNo ? (
                          <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-100/50 px-2 py-1 rounded-lg w-fit">
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse" />
                            Active Now
                          </div>
                        ) : (
                          <p className="text-[10px] text-gray-400 font-bold truncate max-w-[150px]">
                            {student.bio || "No bio set..."}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Role Management - Admin or Co-Leaders with canAppointCoLeaders */}
                    {(isAdmin || canAppointCoLeaders) && student.rollNo !== ADMIN_STUDENT.rollNo && (
                      <div className="flex flex-col gap-1">
                        {/* Role Management */}
                        <div className="flex gap-1">
                          {student.role !== 'co-leader' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRoleChange(student, 'co-leader');
                              }}
                              disabled={isUpdatingRole === student.rollNo}
                              className="p-1 text-purple-500 hover:bg-purple-100 rounded transition-all"
                              title="Make Co-Leader"
                            >
                              <UserCheck className="w-3 h-3" />
                            </button>
                          )}
                          {student.role === 'co-leader' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRoleChange(student, 'student');
                              }}
                              disabled={isUpdatingRole === student.rollNo}
                              className="p-1 text-gray-500 hover:bg-gray-100 rounded transition-all"
                              title="Remove Co-Leader"
                            >
                              <UserX className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Password Management & Delete - Admin Only */}
                    {isAdmin && student.rollNo !== ADMIN_STUDENT.rollNo && (
                      <div className="flex flex-col gap-1">
                        {/* Password Management */}
                        {student.isProtected ? (
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePasswordChange(student);
                              }}
                              className="p-1 text-blue-500 hover:bg-blue-100 rounded transition-all"
                              title="Change Password"
                            >
                              <Key className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemovePassword(student);
                              }}
                              className="p-1 text-orange-500 hover:bg-orange-100 rounded transition-all"
                              title="Remove Password"
                            >
                              <Shield className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePasswordChange(student);
                              }}
                              className="p-1 text-green-500 hover:bg-green-100 rounded transition-all"
                              title="Add Password"
                            >
                              <Key className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStudent(student.rollNo, student.name);
                          }}
                          disabled={isDeleting === student.rollNo}
                          className="p-1 text-red-500 hover:bg-red-100 rounded transition-all disabled:opacity-50"
                          title="Delete Student"
                        >
                          {isDeleting === student.rollNo ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No students found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
