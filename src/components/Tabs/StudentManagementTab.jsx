import { useState, useMemo } from "react";
import { Star, Users, Plus, Trash2, Crown, User, Loader2, Search, X, Lock } from "lucide-react";
import { subjects, ADMIN_STUDENT } from "../../data/subjects";

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
    selectStudent
  } = studentManagement;

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newStudent, setNewStudent] = useState({ rollNo: '', name: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Admin authentication states
  const [showAdminAuth, setShowAdminAuth] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

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

  const handleStudentClick = (student) => {
    // Check if trying to select admin student
    if (student.rollNo === ADMIN_STUDENT.rollNo && selectedStudent?.rollNo !== ADMIN_STUDENT.rollNo) {
      // If current user is not admin, require password
      setShowAdminAuth(true);
      return;
    }
    
    // Regular student or already admin - proceed directly
    selectStudent(student);
  };

  const handleAdminAuth = (e) => {
    e.preventDefault();
    
    if (!adminPassword.trim()) {
      alert('Please enter admin password');
      return;
    }

    setIsAuthenticating(true);
    
    // Simulate auth delay for better UX
    setTimeout(() => {
      if (adminPassword === ADMIN_PASSWORD) {
        // Correct password - proceed with admin login
        const adminStudent = students.find(s => s.rollNo === ADMIN_STUDENT.rollNo);
        selectStudent(adminStudent);
        setShowAdminAuth(false);
        setAdminPassword("");
      } else {
        alert('❌ Incorrect admin password. Please try again.');
        setAdminPassword("");
      }
      setIsAuthenticating(false);
    }, 800);
  };

  const cancelAdminAuth = () => {
    setShowAdminAuth(false);
    setAdminPassword("");
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    
    if (!newStudent.rollNo.trim() || !newStudent.name.trim()) {
      alert('Please fill in both roll number and name');
      return;
    }

    try {
      setIsCreating(true);
      await createStudent(newStudent.rollNo.trim(), newStudent.name.trim());
      setNewStudent({ rollNo: '', name: '' });
      setShowCreateForm(false);
      alert('✅ Student created successfully!');
    } catch (error) {
      alert(`❌ Error creating student: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteStudent = async (rollNo, name) => {
    if (rollNo === ADMIN_STUDENT.rollNo) {
      alert('Cannot delete admin student');
      return;
    }

    const confirmed = window.confirm(
      `⚠️ Are you sure you want to delete student "${name}" (${rollNo})?\n\nThis will permanently delete all their academic data and cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setIsDeleting(rollNo);
      await deleteStudent(rollNo);
      alert('✅ Student deleted successfully!');
    } catch (error) {
      alert(`❌ Error deleting student: ${error.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
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
      {/* Admin Authentication Modal */}
      {showAdminAuth && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Authentication</h2>
              <p className="text-gray-600">Enter admin password to switch to {ADMIN_STUDENT.name}</p>
            </div>

            {/* Password Form */}
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

            {/* Info */}
            <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
              <p className="text-sm text-yellow-700 text-center">
                <strong>Admin privileges include:</strong><br />
                Creating and deleting student accounts, managing all student data
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Student & Semester Management</h2>
        <p className="text-gray-600">Manage students and select current semester</p>
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
                : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`font-bold ${
                    selectedStudent.rollNo === ADMIN_STUDENT.rollNo 
                      ? 'text-yellow-900' 
                      : 'text-blue-900'
                  }`}>
                    {selectedStudent.name}
                  </p>
                  <p className={`text-sm ${
                    selectedStudent.rollNo === ADMIN_STUDENT.rollNo 
                      ? 'text-yellow-700' 
                      : 'text-blue-700'
                  }`}>
                    Roll No: {selectedStudent.rollNo}
                  </p>
                  {selectedStudent.rollNo === ADMIN_STUDENT.rollNo && (
                    <p className="text-xs text-yellow-600 font-medium mt-1">Administrator</p>
                  )}
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
            filteredStudents.map((student) => (
              <div
                key={student.rollNo}
                className={`
                  p-4 rounded-2xl border-2 transition-all cursor-pointer relative
                  ${selectedStudent?.rollNo === student.rollNo
                    ? student.rollNo === ADMIN_STUDENT.rollNo
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-blue-500 bg-blue-50'
                    : student.rollNo === ADMIN_STUDENT.rollNo
                      ? 'border-yellow-200 bg-yellow-50 hover:border-yellow-300'
                      : 'border-gray-200 bg-gray-50 hover:border-blue-300'
                  }
                `}
                onClick={() => handleStudentClick(student)}
              >
                {/* Lock indicator for admin */}
                {student.rollNo === ADMIN_STUDENT.rollNo && selectedStudent?.rollNo !== ADMIN_STUDENT.rollNo && (
                  <div className="absolute top-2 right-2">
                    <Lock className="w-4 h-4 text-yellow-600" />
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-gray-900">{student.name}</h4>
                      {student.rollNo === ADMIN_STUDENT.rollNo && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Roll: {student.rollNo}</p>
                    {selectedStudent?.rollNo === student.rollNo ? (
                      <p className="text-xs text-blue-600 font-medium mt-1">Currently Selected</p>
                    ) : student.rollNo === ADMIN_STUDENT.rollNo ? (
                      <p className="text-xs text-yellow-600 font-medium mt-1">Admin - Password Required</p>
                    ) : null}
                  </div>
                  
                  {isAdmin && student.rollNo !== ADMIN_STUDENT.rollNo && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStudent(student.rollNo, student.name);
                      }}
                      disabled={isDeleting === student.rollNo}
                      className="p-2 text-red-500 hover:bg-red-100 rounded-lg transition-all disabled:opacity-50"
                      title="Delete Student"
                    >
                      {isDeleting === student.rollNo ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))
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
