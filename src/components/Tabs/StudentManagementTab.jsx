import React, { useState, useMemo } from "react";
import { Star, Users, Plus, Trash2, Crown, User, Loader2, Search, X, Lock, Shield, Key, EyeOff, Eye, UserCheck, UserX } from "lucide-react";
import { subjects, ADMIN_STUDENT } from "../../data/subjects";
import { CustomConfirm } from "../CustomConfirm";
import { toast } from 'react-toastify';

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
    updateStudentRole
  } = studentManagement;

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newStudent, setNewStudent] = useState({ rollNo: '', name: '', password: '', role: 'student' });
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Admin authentication states
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState("");

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
    onConfirm: () => {}
  });

  const ADMIN_PASSWORD = "admin123"; // Should match the one in StudentSelectionScreen

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    
    const query = searchQuery.toLowerCase();
    return students.filter(student => 
      student.name.toLowerCase().includes(query) ||
      student.rollNo.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

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

  const handleStudentClick = async (student) => {
    // Check if trying to select admin student and current user is not admin
    if (student.rollNo === ADMIN_STUDENT.rollNo && selectedStudent?.rollNo !== ADMIN_STUDENT.rollNo) {
      setShowAdminAuth(true);
      setAuthError("");
      return;
    }
    
    // Check if student is password protected
    if (student.isProtected && student.rollNo !== selectedStudent?.rollNo) {
      const password = prompt(`Enter password for ${student.name}:`);
      if (password === null) return; // User cancelled
      
      const isValid = await authenticateStudent(student, password);
      if (!isValid) {
        toast.error('❌ Incorrect password');
        return;
      }
    }
    
    // Proceed with selection
    selectStudent(student);
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

  const cancelAdminAuth = () => {
    setShowAdminAuth(false);
    setAdminPassword("");
    setAuthError("");
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    
    if (!newStudent.rollNo.trim() || !newStudent.name.trim()) {
      toast.error('Please fill in both roll number and name');
      return;
    }

    if (passwordProtected && !newStudent.password.trim()) {
      toast.error('Please enter a password or uncheck password protection');
      return;
    }

    try {
      setIsCreating(true);
      await createStudent(
        newStudent.rollNo.trim(), 
        newStudent.name.trim(), 
        passwordProtected ? newStudent.password.trim() : '',
        newStudent.role
      );
      setNewStudent({ rollNo: '', name: '', password: '', role: 'student' });
      setPasswordProtected(false);
      setShowCreateForm(false);
      toast.success('✅ Student created successfully!');
    } catch (error) {
      toast.error(`❌ Error creating student: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
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
      await updateStudentPassword(passwordChangeStudent.rollNo, newPasswordData.password);
      setShowPasswordChange(false);
      setPasswordChangeStudent(null);
      toast.success('✅ Password updated successfully!');
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

  const clearSearch = () => {
    setSearchQuery("");
  };

  const getRoleDisplay = (role) => {
    switch(role) {
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

      {/* Password Change Modal */}
      {showPasswordChange && passwordChangeStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Key className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Change Password</h2>
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
                  onChange={(e) => setNewPasswordData({...newPasswordData, password: e.target.value})}
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
                  onChange={(e) => setNewPasswordData({...newPasswordData, confirmPassword: e.target.value})}
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
                  <span>Update Password</span>
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
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Student & Semester Management</h2>
        <p className="text-gray-600">Manage students, roles, and select current semester</p>
      </div>

      {/* Current Student & Semester */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Student */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            Current Student
            {selectedStudent?.rollNo === ADMIN_STUDENT.rollNo && (
              <Crown className="w-4 h-4 text-yellow-500" />
            )}
          </h3>
          
          {selectedStudent && (
            <div className={`rounded-2xl p-4 border ${
              selectedStudent.rollNo === ADMIN_STUDENT.rollNo 
                ? 'bg-yellow-50 border-yellow-200' 
                : selectedStudent.role === 'co-leader'
                  ? 'bg-purple-50 border-purple-200'
                  : selectedStudent.isProtected
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-bold ${
                    selectedStudent.rollNo === ADMIN_STUDENT.rollNo 
                      ? 'text-yellow-900' 
                      : selectedStudent.role === 'co-leader'
                        ? 'text-purple-900'
                        : 'text-blue-900'
                  }`}>
                    {selectedStudent.name}
                  </p>
                  <p className={`text-sm ${
                    selectedStudent.rollNo === ADMIN_STUDENT.rollNo 
                      ? 'text-yellow-700' 
                      : selectedStudent.role === 'co-leader'
                        ? 'text-purple-700'
                        : 'text-blue-700'
                  }`}>
                    Roll No: {selectedStudent.rollNo}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                      getRoleDisplay(selectedStudent.role || 'student').bgColor
                    }`}>
                      {React.createElement(getRoleDisplay(selectedStudent.role || 'student').icon, { 
                        className: `w-3 h-3 ${getRoleDisplay(selectedStudent.role || 'student').color}` 
                      })}
                      <span className={getRoleDisplay(selectedStudent.role || 'student').color}>
                        {getRoleDisplay(selectedStudent.role || 'student').name}
                      </span>
                    </div>
                    {selectedStudent.isProtected && (
                      <div className="flex items-center gap-1">
                        <Lock className="w-3 h-3 text-blue-600" />
                        <span className="text-xs text-blue-600 font-medium">Protected</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Current Semester */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Current Semester</h3>
          
          <select
            className="w-full p-4 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg font-medium bg-white"
            value={semester}
            onChange={(e) => setSemester(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem}>
                Semester {sem} ({subjects[sem].theory.length} theory + {subjects[sem].practical.length} practical)
              </option>
            ))}
          </select>

          <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-3">
              <Star className="w-4 h-4 text-blue-600 mt-1" />
              <div>
                <h4 className="font-medium text-blue-900 text-sm">Semester {semester} Overview</h4>
                <p className="text-xs text-blue-700">
                  {subjects[semester].theory.length} theory subjects and {subjects[semester].practical.length} practical labs
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Student Selection */}
      <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Select Student ({students.length} total)
          </h3>
          
          {isAdmin && (
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Student
            </button>
          )}
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search students by name or roll number..."
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

        {/* Create Student Form */}
        {showCreateForm && isAdmin && (
          <form onSubmit={handleCreateStudent} className="mb-6 p-4 bg-green-50 rounded-2xl border border-green-200">
            <h4 className="font-medium text-green-900 mb-3">Create New Student</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                placeholder="Roll Number (e.g., 2405226)"
                value={newStudent.rollNo}
                onChange={(e) => setNewStudent({...newStudent, rollNo: e.target.value})}
                className="p-3 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
              <input
                type="text"
                placeholder="Full Name"
                value={newStudent.name}
                onChange={(e) => setNewStudent({...newStudent, name: e.target.value})}
                className="p-3 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              />
            </div>

            {/* Role Selection */}
            <div className="mb-3">
              <label className="block text-sm font-medium text-green-900 mb-2">Role</label>
              <select
                value={newStudent.role}
                onChange={(e) => setNewStudent({...newStudent, role: e.target.value})}
                className="w-full p-3 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="student">Student</option>
                <option value="co-leader">Co-Leader</option>
              </select>
            </div>

            {/* Password Protection Toggle */}
            <div className="mb-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={passwordProtected}
                  onChange={(e) => setPasswordProtected(e.target.checked)}
                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                />
                <span className="text-sm font-medium text-green-900 flex items-center gap-1">
                  <Shield className="w-4 h-4" />
                  Password protect this account
                </span>
              </label>
            </div>

            {/* Password Field */}
            {passwordProtected && (
              <div className="relative mb-3">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={newStudent.password}
                  onChange={(e) => setNewStudent({...newStudent, password: e.target.value})}
                  className="w-full pl-10 pr-10 p-3 border border-green-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                  required={passwordProtected}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isCreating}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all disabled:opacity-50"
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {isCreating ? 'Creating...' : 'Create Student'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
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
                    p-4 rounded-2xl border-2 transition-all cursor-pointer relative
                    ${selectedStudent?.rollNo === student.rollNo
                      ? student.rollNo === ADMIN_STUDENT.rollNo
                        ? 'border-yellow-500 bg-yellow-50'
                        : student.role === 'co-leader'
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-blue-500 bg-blue-50'
                      : student.rollNo === ADMIN_STUDENT.rollNo
                        ? 'border-yellow-200 bg-yellow-50 hover:border-yellow-300'
                        : student.role === 'co-leader'
                          ? 'border-purple-200 bg-purple-50 hover:border-purple-300'
                          : student.isProtected
                            ? 'border-blue-200 bg-blue-50 hover:border-blue-300'
                            : 'border-gray-200 bg-gray-50 hover:border-blue-300'
                    }
                  `}
                  onClick={() => handleStudentClick(student)}
                >
                  {/* Protection indicator */}
                  {student.isProtected && (
                    <div className="absolute top-2 right-2">
                      <Lock className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-bold text-gray-900">{student.name}</h4>
                        {React.createElement(roleDisplay.icon, { 
                          className: `w-4 h-4 ${roleDisplay.color}` 
                        })}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">Roll: {student.rollNo}</p>
                      
                      {/* Role Badge */}
                      <div className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${roleDisplay.bgColor}`}>
                        <span className={roleDisplay.color}>{roleDisplay.name}</span>
                      </div>
                      
                      <div className="mt-2">
                        {selectedStudent?.rollNo === student.rollNo ? (
                          <p className="text-xs text-blue-600 font-medium">Currently Selected</p>
                        ) : student.isProtected ? (
                          <p className="text-xs text-blue-600 font-medium">Password Protected</p>
                        ) : null}
                      </div>
                    </div>
                    
                    {isAdmin && student.rollNo !== ADMIN_STUDENT.rollNo && (
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
                        
                        {/* Password Management */}
                        {student.isProtected && (
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
