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
  AlertTriangle
} from "lucide-react";
import { ADMIN_STUDENT } from "../../data/subjects";
import { toast } from 'react-toastify';

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
    updateCoLeaderPermissions
  } = studentManagement;

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

  // Permission toggle handler
  const handlePermissionToggle = async (rollNo, permissionKey, currentValue) => {
    if (!isAdmin) {
      toast.error('Only admin can modify co-leader permissions');
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
        onNavigateToTab(4, { showCreateForm: true });
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
        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all"
      >
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isEnabled ? 'bg-green-100' : 'bg-gray-200'
            }`}>
            <PermIcon className={`w-4 h-4 ${isEnabled ? 'text-green-600' : 'text-gray-500'}`} />
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{permissionLabels[permKey].label}</p>
            <p className="text-xs text-gray-500">{permissionLabels[permKey].desc}</p>
          </div>
        </div>

        <button
          onClick={() => handlePermissionToggle(coLeader.rollNo, permKey, isEnabled)}
          disabled={isLoading || !isAdmin}
          className={`relative w-12 h-6 rounded-full transition-all ${isEnabled ? 'bg-green-500' : 'bg-gray-300'
            } ${!isAdmin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            </div>
          ) : (
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${isEnabled ? 'left-6' : 'left-0.5'
              }`} />
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
          <h2 className="text-4xl font-extrabold text-white mb-2 tracking-tight">
            Admin Privileges
          </h2>
          <p className="text-gray-400 max-w-xl mx-auto text-lg">
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
              <h3 className={`font-bold text-2xl ${isAdmin ? 'text-amber-900' : 'text-purple-900'}`}>
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

      {/* Co-Leader Permissions (Admin Only) */}
      {isAdmin && (
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-purple-500" />
            Co-Leader Permissions
            <span className="text-sm font-normal text-gray-500 ml-2">
              ({coLeaders.length} co-leader{coLeaders.length !== 1 ? 's' : ''})
            </span>
          </h3>

          {coLeaders.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-2xl">
              <Star className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-600 mb-2">No co-leaders appointed yet</p>
              <p className="text-sm text-gray-500">
                Go to Student & Settings to promote students to co-leader role
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {coLeaders.map((coLeader) => (
                <div
                  key={coLeader.rollNo}
                  className="border border-gray-200 rounded-2xl overflow-hidden"
                >
                  {/* Co-Leader Header */}
                  <button
                    onClick={() => setExpandedCoLeader(
                      expandedCoLeader === coLeader.rollNo ? null : coLeader.rollNo
                    )}
                    className="w-full flex items-center justify-between p-4 bg-purple-50 hover:bg-purple-100 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
                        <Star className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-purple-900">{coLeader.name}</p>
                        <p className="text-sm text-purple-700">{coLeader.rollNo}</p>
                      </div>
                    </div>
                    {expandedCoLeader === coLeader.rollNo ? (
                      <ChevronUp className="w-5 h-5 text-purple-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-purple-600" />
                    )}
                  </button>

                  {/* Permissions Panel */}
                  {expandedCoLeader === coLeader.rollNo && (
                    <div className="p-4 space-y-3 bg-white">
                      {Object.keys(permissionLabels).map((permKey) =>
                        renderPermissionToggle(coLeader, permKey)
                      )}
                    </div>
                  )}
                </div>
              ))}
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
    </div>
  );
}
