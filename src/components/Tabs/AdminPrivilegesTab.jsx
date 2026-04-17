import React, { useState, useMemo } from "react";
import {
  Shield,
  Crown,
  Star,
  Users,
  Plus,
  Megaphone,
  Key,
  Lock,
  UserPlus,
  UserCheck,
  Settings,
  ChevronDown,
  ChevronUp,
  Loader2,
  Search,
  X,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  UserX,
  UserCog,
  Filter,
  Sparkles
} from "lucide-react";
import { ADMIN_STUDENT } from "../../data/subjects";
import { toast } from 'react-toastify';
import { SubjectManager } from "../Admin/SubjectManager";
import { useSubjects } from "../hooks/useSubjects";
import { BRANCHES } from "../../data/subjects";
import { CreateStudentForm } from "../Admin/CreateStudentForm";
import { db } from "../../firebase";
import { collection, getDocs, doc, writeBatch } from "firebase/firestore";

// Default permissions for new co-leaders
const DEFAULT_PERMISSIONS = {
  canCreateUsers: false,
  canPostNotices: true,
  canAppointCoLeaders: false,
  canManagePasswords: false
};

export function AdminPrivilegesTab({
  selectedStudent,
  studentManagement,
  onNavigateToTab
}) {
  const {
    students,
    isAdmin,
    updateStudentRole,
    updateStudentPassword,
    updateCoLeaderPermissions,
    createStudent
  } = studentManagement;

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [adminBranchView, setAdminBranchView] = useState('IT');

  // Initialize subjects config hook scoped to Admin Tab
  const subjectsHook = useSubjects(isAdmin, selectedStudent?.role === 'co-leader', adminBranchView);
  const { subjectsConfig } = subjectsHook;

  const [expandedCoLeader, setExpandedCoLeader] = useState(null);
  const [passwordSearchQuery, setPasswordSearchQuery] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordModalStudent, setPasswordModalStudent] = useState(null);
  const [passwordModalMode, setPasswordModalMode] = useState('add'); // 'add', 'change', 'remove'
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isUpdatingPermission, setIsUpdatingPermission] = useState(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isMigratingNotices, setIsMigratingNotices] = useState(false);
  const [showAppointModal, setShowAppointModal] = useState(false);
  const [appointSearchQuery, setAppointSearchQuery] = useState("");
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('All');
  const [isAppointingCoLeader, setIsAppointingCoLeader] = useState(false);
  const [isRemovingCoLeader, setIsRemovingCoLeader] = useState(null);

  const handleMigrateNotices = async () => {
    if (!isAdmin) return;
    
    setIsMigratingNotices(true);
    try {
      const q = collection(db, 'noticeBoard');
      const snapshot = await getDocs(q);
      
      const batch = writeBatch(db);
      let migrationCount = 0;

      snapshot.docs.forEach(document => {
        const data = document.data();
        const oldId = document.id;

        // Skip if already migrated (starts with "Sem")
        if (oldId.startsWith('Sem')) return;

        const date = data.createdAt && data.createdAt.toDate ? data.createdAt.toDate() : new Date();
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        let branchStr = 'All';
        const targetBranches = data.targetBranches || ['All'];
        if (targetBranches.length > 0 && !targetBranches.includes('All')) {
          branchStr = targetBranches.join('-');
        }
        if (branchStr.length > 15) {
          branchStr = branchStr.substring(0, 15) + '...';
        }

        const type = data.type || 'notice';
        const currentSemester = data.semester || '5';
        const timestamp = Date.now();
        const newId = `Sem${currentSemester}_${branchStr}_${type}_${dateStr}_${timestamp}`;

        const newRef = doc(db, 'noticeBoard', newId);
        batch.set(newRef, data);

        const oldRef = doc(db, 'noticeBoard', oldId);
        batch.delete(oldRef);

        migrationCount++;
      });

      if (migrationCount > 0) {
        await batch.commit();
        toast.success(`Migration complete! Converted ${migrationCount} notices to Semantic IDs.`);
      } else {
        toast.info("All notices are already using Semantic IDs!");
      }
    } catch (error) {
      console.error(error);
      toast.error(`Migration failed: ${error.message}`);
    } finally {
      setIsMigratingNotices(false);
    }
  };

  // Check if current user is co-leader (not admin)
  const isCoLeader = selectedStudent?.role === 'co-leader' &&
    selectedStudent?.rollNo !== ADMIN_STUDENT.rollNo;

  // Get current user's permissions (for co-leaders)
  const currentUserPermissions = useMemo(() => {
    if (isAdmin) return null; // Admin has all permissions
    if (isCoLeader) {
      return selectedStudent?.permissions || DEFAULT_PERMISSIONS;
    }
    return null;
  }, [isAdmin, isCoLeader, selectedStudent]);

  // Get all co-leaders
  const coLeaders = useMemo(() => {
    return students.filter(s =>
      s.role === 'co-leader' && s.rollNo !== ADMIN_STUDENT.rollNo
    );
  }, [students]);

  // Get students eligible for co-leader appointment
  const eligibleStudents = useMemo(() => {
    let filtered = students.filter(s => 
      s.role === 'student' && s.rollNo !== ADMIN_STUDENT.rollNo
    );

    // Filter by branch
    if (selectedBranchFilter !== 'All') {
      filtered = filtered.filter(s => s.branch === selectedBranchFilter);
    }

    // Filter by search query
    if (appointSearchQuery.trim()) {
      const query = appointSearchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.rollNo.toLowerCase().includes(query) ||
        s.branch.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name));
  }, [students, selectedBranchFilter, appointSearchQuery]);

  // Filter students for password management
  // Co-leaders should not be able to manage admin's password
  const filteredStudentsForPassword = useMemo(() => {
    let filtered = students;

    // If current user is a co-leader (not admin), exclude admin from the list
    if (isCoLeader && !isAdmin) {
      filtered = filtered.filter(s => s.rollNo !== ADMIN_STUDENT.rollNo);
    }

    if (!passwordSearchQuery.trim()) return filtered;
    const query = passwordSearchQuery.toLowerCase();
    return filtered.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.rollNo.toLowerCase().includes(query)
    );
  }, [students, passwordSearchQuery, isCoLeader, isAdmin]);

  // Appoint co-leader handler
  const handleAppointCoLeader = async (student) => {
    if (!isAdmin && !currentUserPermissions?.canAppointCoLeaders) {
      toast.error('Only admin or co-leaders with Appointment privilege can appoint co-leaders');
      return;
    }

    setIsAppointingCoLeader(student.rollNo);
    try {
      await updateStudentRole(student.rollNo, 'co-leader');
      toast.success(`✅ ${student.name} has been appointed as Co-Leader!`);
      setShowAppointModal(false);
      setAppointSearchQuery("");
    } catch (error) {
      toast.error(`❌ Failed to appoint co-leader: ${error.message}`);
    } finally {
      setIsAppointingCoLeader(false);
    }
  };

  // Remove co-leader handler
  const handleRemoveCoLeader = async (coLeader) => {
    if (!isAdmin && !currentUserPermissions?.canAppointCoLeaders) {
      toast.error('Only admin or co-leaders with Appointment privilege can remove co-leaders');
      return;
    }

    if (!window.confirm(`Are you sure you want to remove ${coLeader.name} as Co-Leader? They will lose all permissions.`)) {
      return;
    }

    setIsRemovingCoLeader(coLeader.rollNo);
    try {
      await updateStudentRole(coLeader.rollNo, 'student');
      toast.success(`✅ ${coLeader.name} has been removed as Co-Leader`);
      setExpandedCoLeader(null);
    } catch (error) {
      toast.error(`❌ Failed to remove co-leader: ${error.message}`);
    } finally {
      setIsRemovingCoLeader(null);
    }
  };

  // Permission toggle handler
  const handlePermissionToggle = async (rollNo, permissionKey, currentValue) => {
    if (!isAdmin && !currentUserPermissions?.canAppointCoLeaders) {
      toast.error('Only admin or co-leaders with Appointment privilege can modify permissions');
      return;
    }

    setIsUpdatingPermission(`${rollNo}-${permissionKey}`);
    try {
      const student = students.find(s => s.rollNo === rollNo);
      const currentPermissions = student?.permissions || DEFAULT_PERMISSIONS;
      const newPermissions = {
        ...currentPermissions,
        [permissionKey]: !currentValue
      };

      await updateCoLeaderPermissions(rollNo, newPermissions);
      toast.success(`Permission updated successfully!`);
    } catch (error) {
      toast.error(`Failed to update permission: ${error.message}`);
    } finally {
      setIsUpdatingPermission(null);
    }
  };

  // Password modal handlers
  const openPasswordModal = (student, mode) => {
    setPasswordModalStudent(student);
    setPasswordModalMode(mode);
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowPasswordModal(true);
  };

  const handlePasswordAction = async () => {
    if (passwordModalMode !== 'remove') {
      if (!newPassword.trim()) {
        toast.error('Please enter a password');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('Passwords do not match');
        return;
      }
    }

    setIsUpdatingPassword(true);
    try {
      if (passwordModalMode === 'remove') {
        await updateStudentPassword(passwordModalStudent.rollNo, '', true);
        toast.success('Password removed successfully!');
      } else {
        await updateStudentPassword(passwordModalStudent.rollNo, newPassword);
        toast.success(passwordModalMode === 'add' ? 'Password added successfully!' : 'Password changed successfully!');
      }
      setShowPasswordModal(false);
    } catch (error) {
      toast.error(`Failed to ${passwordModalMode} password: ${error.message}`);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // Quick action handlers
  const handleQuickAction = (action) => {
    switch (action) {
      case 'createUser':
        setShowCreateForm(true);
        // Scroll to form
        window.scrollTo({ top: 0, behavior: 'smooth' });
        break;
      case 'manageNotices':
        onNavigateToTab(2);
        break;
      case 'viewStudents':
        onNavigateToTab(4);
        break;
      default:
        break;
    }
  };

  const handleCreateStudent = async (studentData) => {
    setIsCreating(true);
    try {
      await createStudent(
        studentData.rollNo,
        studentData.name,
        studentData.password,
        studentData.role,
        studentData.admissionYear,
        studentData.isDSY,
        studentData.isYD,
        studentData.branch
      );
      toast.success(`✅ Student ${studentData.name} created successfully!`);
      setShowCreateForm(false);
    } catch (error) {
      toast.error(`❌ Failed to create student: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Permission labels
  const permissionLabels = {
    canCreateUsers: {
      label: 'Create Users',
      desc: 'Can create new student accounts',
      icon: UserPlus
    },
    canPostNotices: {
      label: 'Post Notices',
      desc: 'Can create and manage notices',
      icon: Megaphone
    },
    canAppointCoLeaders: {
      label: 'Appoint Co-Leaders',
      desc: 'Can promote students to co-leader role',
      icon: Star
    },
    canManagePasswords: {
      label: 'Manage Passwords',
      desc: 'Can add, change, or remove user passwords',
      icon: Key
    }
  };

  // Render permission toggle
  const renderPermissionToggle = (coLeader, permKey) => {
    const permissions = coLeader.permissions || DEFAULT_PERMISSIONS;
    const isEnabled = permissions[permKey] ?? DEFAULT_PERMISSIONS[permKey];
    const isLoading = isUpdatingPermission === `${coLeader.rollNo}-${permKey}`;
    const PermIcon = permissionLabels[permKey].icon;

    return (
      <div
        key={permKey}
        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
          isEnabled 
            ? 'bg-green-50 border-green-200 hover:bg-green-100' 
            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
        }`}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
            isEnabled ? 'bg-gradient-to-br from-green-400 to-green-600' : 'bg-gradient-to-br from-gray-300 to-gray-400'
          }`}>
            <PermIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className={`font-semibold text-sm ${isEnabled ? 'text-green-900' : 'text-gray-700'}`}>
              {permissionLabels[permKey].label}
            </p>
            <p className="text-xs text-gray-600 mt-0.5">{permissionLabels[permKey].desc}</p>
          </div>
        </div>

        <button
          onClick={() => handlePermissionToggle(coLeader.rollNo, permKey, isEnabled)}
          disabled={isLoading || (!isAdmin && !currentUserPermissions?.canAppointCoLeaders)}
          className={`relative w-14 h-7 rounded-full transition-all shadow-inner ${
            isEnabled ? 'bg-green-500' : 'bg-gray-300'
          } ${(!isAdmin && !currentUserPermissions?.canAppointCoLeaders) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}`}
        >
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            </div>
          ) : (
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-all flex items-center justify-center ${
              isEnabled ? 'left-7' : 'left-0.5'
            }`}>
              {isEnabled ? (
                <Check className="w-3 h-3 text-green-600" />
              ) : (
                <X className="w-3 h-3 text-gray-400" />
              )}
            </div>
          )}
        </button>
      </div>
    );
  };

  if (!selectedStudent) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Student Selected</h3>
          <p className="text-gray-600">Please select a student to view admin privileges</p>
        </div>
      </div>
    );
  }

  // Only admins and co-leaders can access this tab
  if (!isAdmin && !isCoLeader) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">Only admins and co-leaders can access this panel</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Create Student Form Section */}
      {/* Create Student Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[60] animate-in fade-in duration-300">
          <div className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CreateStudentForm
              onSubmit={handleCreateStudent}
              onCancel={() => setShowCreateForm(false)}
              isLoading={isCreating}
              currentUser={selectedStudent}
              canAppointCoLeaders={isAdmin || currentUserPermissions?.canAppointCoLeaders}
            />
          </div>
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && passwordModalStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${passwordModalMode === 'remove'
                ? 'bg-gradient-to-r from-red-500 to-orange-500'
                : 'bg-gradient-to-r from-blue-500 to-purple-500'
                }`}>
                <Key className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {passwordModalMode === 'add' && 'Add Password'}
                {passwordModalMode === 'change' && 'Change Password'}
                {passwordModalMode === 'remove' && 'Remove Password'}
              </h2>
              <p className="text-gray-600">
                {passwordModalMode === 'remove'
                  ? `Remove password protection from ${passwordModalStudent.name}?`
                  : `Set password for ${passwordModalStudent.name}`
                }
              </p>
            </div>

            {passwordModalMode !== 'remove' && (
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    ) : (
                      <Eye className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <Lock className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {passwordModalMode === 'remove' && (
              <div className="p-4 bg-red-50 rounded-xl border border-red-200 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-700">
                    This will allow anyone to access this student's account without a password.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={handlePasswordAction}
                disabled={isUpdatingPassword}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium ${passwordModalMode === 'remove'
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-blue-500 hover:bg-blue-600'
                  }`}
              >
                {isUpdatingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>{passwordModalMode === 'remove' ? 'Remove Password' : 'Save Password'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                disabled={isUpdatingPassword}
                className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with Premium Gradient */}
      <div className="relative overflow-hidden rounded-3xl p-8 mb-8 text-center bg-gray-900 border border-gray-800 shadow-2xl">
        <div className={`absolute top-0 right-0 w-64 h-64 bg-gradient-to-br rounded-full blur-[100px] opacity-30 ${isAdmin ? 'from-yellow-600 to-amber-800' : 'from-purple-600 to-pink-800'}`} />
        <div className={`absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr rounded-full blur-[100px] opacity-30 ${isAdmin ? 'from-amber-600 to-yellow-800' : 'from-pink-600 to-purple-800'}`} />

        <div className="relative">
          <div className="inline-flex items-center justify-center p-3 mb-4 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-xl">
            {isAdmin ? (
              <Crown className="w-10 h-10 text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
            ) : (
              <Star className="w-10 h-10 text-purple-400 drop-shadow-[0_0_15px_rgba(192,132,252,0.5)]" />
            )}
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">
            Admin Privileges
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-base sm:text-lg">
            {isAdmin
              ? 'Manage co-leader permissions and quick admin actions with executive control'
              : 'View your assigned permissions and accessible management tools'
            }
          </p>
        </div>
      </div>

      {/* Role Badge - Premium Glass Card */}
      <div className={`relative overflow-hidden rounded-3xl p-1 border shadow-xl ${isAdmin
        ? 'bg-gradient-to-br from-amber-200/50 via-yellow-100/50 to-orange-100/50 border-amber-200'
        : 'bg-gradient-to-br from-purple-200/50 via-fuchsia-100/50 to-pink-100/50 border-purple-200'
        }`}>
        <div className={`absolute inset-0 opacity-40 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]`} />

        <div className={`relative flex items-center gap-6 p-6 rounded-[20px] backdrop-blur-sm ${isAdmin ? 'bg-white/40' : 'bg-white/40'}`}>
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${isAdmin
            ? 'bg-gradient-to-br from-yellow-400 to-amber-600 text-white'
            : 'bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white'
            }`}>
            {isAdmin ? (
              <Crown className="w-8 h-8 drop-shadow-md" />
            ) : (
              <Star className="w-8 h-8 drop-shadow-md" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-bold text-xl sm:text-2xl ${isAdmin ? 'text-amber-900' : 'text-purple-900'}`}>
                {isAdmin ? 'Administrator' : 'Co-Leader'}
              </h3>
              <span className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${isAdmin ? 'bg-amber-900/10 text-amber-900' : 'bg-purple-900/10 text-purple-900'
                }`}>
                Verified
              </span>
            </div>
            <p className={`font-medium ${isAdmin ? 'text-amber-700' : 'text-purple-700'}`}>
              {selectedStudent.name} <span className="opacity-60">•</span> {selectedStudent.rollNo}
            </p>
          </div>

          <div className="ml-auto hidden md:block opacity-10 scale-150 transform translate-x-4">
            {isAdmin ? <Crown size={120} /> : <Star size={120} />}
          </div>
        </div>
      </div>

      {/* Quick Actions - Premium Cards */}
      <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg">
            <Settings className="w-5 h-5 text-gray-700" />
          </div>
          Quick Actions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Create User Button */}
          {(isAdmin || currentUserPermissions?.canCreateUsers) && (
            <button
              onClick={() => handleQuickAction('createUser')}
              className="relative overflow-hidden flex items-center gap-4 p-5 bg-gradient-to-br from-white to-green-50 hover:from-green-50 hover:to-green-100 rounded-2xl border border-green-100 hover:border-green-300 transition-all group shadow-md hover:shadow-lg hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-bold text-green-900 text-lg group-hover:text-green-800">Create User</p>
                <p className="text-xs text-green-600 font-medium">Add new student</p>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-green-200/20 rounded-full blur-2xl transform translate-x-8 -translate-y-8 group-hover:bg-green-300/30 transition-all" />
            </button>
          )}

          {/* Manage Notices Button */}
          {(isAdmin || currentUserPermissions?.canPostNotices) && (
            <button
              onClick={() => handleQuickAction('manageNotices')}
              className="relative overflow-hidden flex items-center gap-4 p-5 bg-gradient-to-br from-white to-blue-50 hover:from-blue-50 hover:to-blue-100 rounded-2xl border border-blue-100 hover:border-blue-300 transition-all group shadow-md hover:shadow-lg hover:-translate-y-1"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Megaphone className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <p className="font-bold text-blue-900 text-lg group-hover:text-blue-800">Manage Notices</p>
                <p className="text-xs text-blue-600 font-medium">Create & edit notices</p>
              </div>
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-200/20 rounded-full blur-2xl transform translate-x-8 -translate-y-8 group-hover:bg-blue-300/30 transition-all" />
            </button>
          )}

          {/* View Students Button */}
          <button
            onClick={() => handleQuickAction('viewStudents')}
            className="relative overflow-hidden flex items-center gap-4 p-5 bg-gradient-to-br from-white to-purple-50 hover:from-purple-50 hover:to-purple-100 rounded-2xl border border-purple-100 hover:border-purple-300 transition-all group shadow-md hover:shadow-lg hover:-translate-y-1"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-fuchsia-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <p className="font-bold text-purple-900 text-lg group-hover:text-purple-800">View Students</p>
              <p className="text-xs text-purple-600 font-medium">Student management</p>
            </div>
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-200/20 rounded-full blur-2xl transform translate-x-8 -translate-y-8 group-hover:bg-purple-300/30 transition-all" />
          </button>
        </div>
      </div>

      {/* Curriculum Management (Admin Only) */}
      {isAdmin && (
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="w-6 h-6 text-indigo-500" />
              Curriculum Management
            </h3>
            
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-2 flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">Select Branch:</span>
              <select
                value={adminBranchView}
                onChange={(e) => setAdminBranchView(e.target.value)}
                className="px-3 py-1.5 border border-indigo-200 rounded-lg text-sm font-bold text-indigo-900 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {BRANCHES.map(branch => (
                  <option key={branch} value={branch}>{branch}</option>
                ))}
              </select>
            </div>
          </div>
          
          <SubjectManager subjectsConfig={subjectsConfig} subjectsHook={subjectsHook} />
        </div>
      )}

      {/* Co-Leader Permissions (Admin + Privileged Co-Leaders) */}
      {(isAdmin || currentUserPermissions?.canAppointCoLeaders) && (
        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl shadow-lg p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  Co-Leader Management
                  <Sparkles className="w-5 h-5 text-purple-500" />
                </h3>
                <p className="text-sm text-gray-600">
                  {coLeaders.length} active co-leader{coLeaders.length !== 1 ? 's' : ''} • Manage permissions & roles
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAppointModal(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl hover:from-purple-600 hover:to-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
            >
              <UserPlus className="w-4 h-4" />
              Appoint Co-Leader
            </button>
          </div>

          {coLeaders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-purple-200">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <UserCog className="w-10 h-10 text-purple-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Co-Leaders Yet</h4>
              <p className="text-gray-600 mb-4 max-w-md mx-auto">
                Appoint trusted students as co-leaders to help manage the system with customizable permissions
              </p>
              <button
                onClick={() => setShowAppointModal(true)}
                className="px-6 py-2.5 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-all inline-flex items-center gap-2 font-medium"
              >
                <Plus className="w-4 h-4" />
                Appoint Your First Co-Leader
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {coLeaders.map((coLeader) => {
                const permissions = coLeader.permissions || DEFAULT_PERMISSIONS;
                const activePermissionsCount = Object.values(permissions).filter(Boolean).length;
                
                return (
                  <div
                    key={coLeader.rollNo}
                    className="border border-purple-200 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all"
                  >
                    {/* Co-Leader Header */}
                    <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-indigo-50">
                      <button
                        onClick={() => setExpandedCoLeader(
                          expandedCoLeader === coLeader.rollNo ? null : coLeader.rollNo
                        )}
                        className="flex-1 flex items-center justify-between hover:opacity-80 transition-all"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                            <Star className="w-6 h-6 text-white" />
                          </div>
                          <div className="text-left">
                            <p className="font-semibold text-gray-900 text-lg">{coLeader.name}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-sm text-purple-700 font-medium">{coLeader.rollNo}</span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full font-medium">
                                {coLeader.branch}
                              </span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-600">
                                {activePermissionsCount}/{Object.keys(DEFAULT_PERMISSIONS).length} permissions
                              </span>
                            </div>
                          </div>
                        </div>
                        {expandedCoLeader === coLeader.rollNo ? (
                          <ChevronUp className="w-5 h-5 text-purple-600" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-purple-600" />
                        )}
                      </button>
                      
                      <button
                        onClick={() => handleRemoveCoLeader(coLeader)}
                        disabled={isRemovingCoLeader === coLeader.rollNo}
                        className="ml-3 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
                        title="Remove Co-Leader"
                      >
                        {isRemovingCoLeader === coLeader.rollNo ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <UserX className="w-5 h-5" />
                        )}
                      </button>
                    </div>

                    {/* Permissions Panel */}
                    {expandedCoLeader === coLeader.rollNo && (
                      <div className="p-5 space-y-3 bg-gradient-to-b from-white to-gray-50">
                        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
                          <Shield className="w-4 h-4 text-purple-500" />
                          <h4 className="font-semibold text-gray-900">Permission Settings</h4>
                        </div>
                        {Object.keys(permissionLabels).map((permKey) =>
                          renderPermissionToggle(coLeader, permKey)
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Your Permissions (Co-Leader View) */}
      {isCoLeader && currentUserPermissions && (
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-500" />
            Your Permissions
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(permissionLabels).map(([key, config]) => {
              const isEnabled = currentUserPermissions[key] ?? DEFAULT_PERMISSIONS[key];
              const PermIcon = config.icon;

              return (
                <div
                  key={key}
                  className={`p-4 rounded-2xl border ${isEnabled
                    ? 'bg-green-50 border-green-200'
                    : 'bg-gray-50 border-gray-200'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isEnabled ? 'bg-green-500' : 'bg-gray-400'
                      }`}>
                      <PermIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className={`font-medium ${isEnabled ? 'text-green-900' : 'text-gray-700'}`}>
                        {config.label}
                      </p>
                      <p className="text-xs text-gray-500">{config.desc}</p>
                    </div>
                    <div className="ml-auto">
                      {isEnabled ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <X className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Password Management (Admin + Co-Leaders with permission) */}
      {(isAdmin || currentUserPermissions?.canManagePasswords) && (
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Key className="w-5 h-5 text-blue-500" />
            Password Management
          </h3>

          {/* Search */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search students by name or roll number..."
              value={passwordSearchQuery}
              onChange={(e) => setPasswordSearchQuery(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {passwordSearchQuery && (
              <button
                onClick={() => setPasswordSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>

          {/* Student List */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredStudentsForPassword.map((student) => (
              <div
                key={student.rollNo}
                className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${student.rollNo === ADMIN_STUDENT.rollNo
                    ? 'bg-yellow-100'
                    : student.role === 'co-leader'
                      ? 'bg-purple-100'
                      : 'bg-blue-100'
                    }`}>
                    {student.rollNo === ADMIN_STUDENT.rollNo ? (
                      <Crown className="w-4 h-4 text-yellow-600" />
                    ) : student.role === 'co-leader' ? (
                      <Star className="w-4 h-4 text-purple-600" />
                    ) : (
                      <UserCheck className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{student.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{student.rollNo}</span>
                      {student.isProtected && (
                        <span className="flex items-center gap-1 text-xs text-green-600">
                          <Lock className="w-3 h-3" />
                          Protected
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!student.isProtected ? (
                    <button
                      onClick={() => openPasswordModal(student, 'add')}
                      className="px-3 py-1.5 text-xs font-medium bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-all"
                    >
                      Add Password
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => openPasswordModal(student, 'change')}
                        className="px-3 py-1.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all"
                      >
                        Change
                      </button>
                      {student.rollNo !== ADMIN_STUDENT.rollNo && (
                        <button
                          onClick={() => openPasswordModal(student, 'remove')}
                          className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all"
                        >
                          Remove
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Migration Panel for Organising NoticeBoard */}
      {isAdmin && (
         <div className="bg-orange-50 rounded-3xl border border-orange-200 p-6 overflow-hidden relative shadow-lg mt-8">
           <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                 <h3 className="text-xl font-bold text-orange-900 mb-2">NoticeBoard Data Migration</h3>
                 <p className="text-orange-700 text-sm mb-4">
                   Click below to automatically reorganize the Notice Board data inside Firestore. This changes the internal document IDs so that they are easily searchable (like <code>Sem5_IT_notice_2024-04-10</code>) without breaking any existing files.
                 </p>
                 <button
                   onClick={handleMigrateNotices}
                   disabled={isMigratingNotices}
                   className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow font-semibold transition-all flex items-center gap-2"
                 >
                   {isMigratingNotices ? (
                     <><Loader2 className="w-5 h-5 animate-spin" /> Processing Migration...</>
                   ) : (
                     "Migrate Random IDs to Semantic IDs"
                   )}
                 </button>
              </div>
           </div>
         </div>
      )}

      {/* Appoint Co-Leader Modal */}
      {showAppointModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Appoint Co-Leader</h3>
                    <p className="text-purple-100 text-sm">Select a student to promote to co-leader role</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowAppointModal(false);
                    setAppointSearchQuery("");
                    setSelectedBranchFilter('All');
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {/* Search and Filter */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, roll number, or branch..."
                    value={appointSearchQuery}
                    onChange={(e) => setAppointSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                {/* Branch Filter */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <button
                    onClick={() => setSelectedBranchFilter('All')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      selectedBranchFilter === 'All'
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All Branches
                  </button>
                  {BRANCHES.map(branch => (
                    <button
                      key={branch}
                      onClick={() => setSelectedBranchFilter(branch)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                        selectedBranchFilter === branch
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {branch}
                    </button>
                  ))}
                </div>
              </div>

              {/* Student List */}
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {eligibleStudents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No eligible students found</p>
                    <p className="text-sm mt-1">Try adjusting your filters or search query</p>
                  </div>
                ) : (
                  eligibleStudents.map((student) => (
                    <div
                      key={student.rollNo}
                      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-purple-50 rounded-xl transition-all border border-gray-200 hover:border-purple-300"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{student.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-sm text-gray-600">{student.rollNo}</span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full font-medium">
                              {student.branch}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAppointCoLeader(student)}
                        disabled={isAppointingCoLeader === student.rollNo}
                        className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all disabled:opacity-50 flex items-center gap-2 font-medium"
                      >
                        {isAppointingCoLeader === student.rollNo ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Appointing...
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-4 h-4" />
                            Appoint
                          </>
                        )}
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Info Footer */}
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-medium mb-1">What happens when you appoint a co-leader?</p>
                  <ul className="text-xs text-blue-800 space-y-0.5 ml-4 list-disc">
                    <li>Student will be promoted to co-leader role</li>
                    <li>Default permissions will be assigned (can be customized later)</li>
                    <li>They will have access to admin features based on permissions</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
