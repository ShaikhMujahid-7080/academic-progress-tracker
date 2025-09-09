import { useState, useMemo } from "react";
import { GraduationCap, Users, Crown, User, Loader2, Search, X, Lock, Shield } from "lucide-react";
import { ADMIN_STUDENT } from "../../data/subjects";

export function StudentSelectionScreen({ students, onStudentSelect, isLoading, studentManagement }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showPasswordAuth, setShowPasswordAuth] = useState(false);
  const [selectedStudentForAuth, setSelectedStudentForAuth] = useState(null);
  const [password, setPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState("");

  // Filter students based on search query
  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return students;
    
    const query = searchQuery.toLowerCase();
    return students.filter(student => 
      student.name.toLowerCase().includes(query) ||
      student.rollNo.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  const handleStudentClick = async (student) => {
    if (student.isProtected) {
      // Show password prompt
      setSelectedStudentForAuth(student);
      setShowPasswordAuth(true);
      setPassword("");
      setAuthError("");
    } else {
      // No password required
      onStudentSelect(student);
    }
  };

  const handlePasswordAuth = async (e) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setAuthError('Please enter password');
      return;
    }

    setIsAuthenticating(true);
    setAuthError("");

    try {
      const isValid = await studentManagement.authenticateStudent(selectedStudentForAuth, password);
      
      if (isValid) {
        onStudentSelect(selectedStudentForAuth);
        setShowPasswordAuth(false);
      } else {
        setAuthError('Incorrect password. Please try again.');
        setPassword("");
      }
    } catch (error) {
      setAuthError('Authentication failed. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const cancelPasswordAuth = () => {
    setShowPasswordAuth(false);
    setSelectedStudentForAuth(null);
    setPassword("");
    setAuthError("");
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <GraduationCap className="w-16 h-16 mx-auto text-blue-600 mb-4" />
          <div className="flex items-center gap-3 mb-4">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Loading Academic Tracker...</h1>
          </div>
          <p className="text-gray-600">Setting up your student data</p>
        </div>
      </div>
    );
  }

  // Password Authentication Modal
  if (showPasswordAuth && selectedStudentForAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
            {/* Header */}
            <div className="text-center mb-6">
              <div className={`
                w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4
                ${selectedStudentForAuth.rollNo === ADMIN_STUDENT.rollNo 
                  ? 'bg-gradient-to-r from-yellow-500 to-orange-500' 
                  : 'bg-gradient-to-r from-blue-500 to-purple-500'
                }
              `}>
                {selectedStudentForAuth.rollNo === ADMIN_STUDENT.rollNo ? (
                  <Crown className="w-8 h-8 text-white" />
                ) : (
                  <Lock className="w-8 h-8 text-white" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedStudentForAuth.rollNo === ADMIN_STUDENT.rollNo 
                  ? 'Admin Authentication' 
                  : 'Student Authentication'
                }
              </h2>
              <p className="text-gray-600">
                Enter password to access {selectedStudentForAuth.name}'s account
              </p>
            </div>

            {/* Student Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="font-medium text-gray-900">{selectedStudentForAuth.name}</p>
                  <p className="text-sm text-gray-600">Roll No: {selectedStudentForAuth.rollNo}</p>
                </div>
              </div>
            </div>

            {/* Password Form */}
            <form onSubmit={handlePasswordAuth} className="space-y-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  disabled={isAuthenticating || !password.trim()}
                  className={`
                    flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed
                    ${selectedStudentForAuth.rollNo === ADMIN_STUDENT.rollNo 
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white' 
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }
                  `}
                >
                  {isAuthenticating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      {selectedStudentForAuth.rollNo === ADMIN_STUDENT.rollNo ? (
                        <Crown className="w-4 h-4" />
                      ) : (
                        <Shield className="w-4 h-4" />
                      )}
                      <span>Access Account</span>
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={cancelPasswordAuth}
                  disabled={isAuthenticating}
                  className="px-4 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </form>

            {/* Info */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-sm text-blue-700 text-center">
                This account is password protected for security.
                {selectedStudentForAuth.rollNo === ADMIN_STUDENT.rollNo && 
                  " Admin accounts have full system privileges."
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Academic Progress Tracker</h1>
          <p className="text-gray-600">Select your student profile to continue</p>
        </div>

        {/* Student Selection Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <Users className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Select Student Profile</h2>
            <span className="text-sm text-gray-500">({students.length} total)</span>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
              <Search className="w-5 h-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by name or roll number..."
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

          {/* Student List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => (
                <button
                  key={student.rollNo}
                  onClick={() => handleStudentClick(student)}
                  className={`
                    w-full flex items-center p-4 rounded-2xl border-2 transition-all text-left
                    ${student.rollNo === ADMIN_STUDENT.rollNo
                      ? 'border-yellow-200 bg-yellow-50 hover:border-yellow-300 hover:bg-yellow-100'
                      : student.isProtected
                        ? 'border-blue-200 bg-blue-50 hover:border-blue-300 hover:bg-blue-100'
                        : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50'
                    }
                  `}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`
                      w-12 h-12 rounded-2xl flex items-center justify-center
                      ${student.rollNo === ADMIN_STUDENT.rollNo 
                        ? 'bg-yellow-200' 
                        : student.isProtected
                          ? 'bg-blue-200'
                          : 'bg-gray-200'
                      }
                    `}>
                      {student.rollNo === ADMIN_STUDENT.rollNo ? (
                        <Crown className="w-6 h-6 text-yellow-600" />
                      ) : student.isProtected ? (
                        <Lock className="w-6 h-6 text-blue-600" />
                      ) : (
                        <User className="w-6 h-6 text-gray-600" />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{student.name}</h3>
                        {student.rollNo === ADMIN_STUDENT.rollNo && (
                          <div className="flex items-center gap-1">
                            <Crown className="w-4 h-4 text-yellow-600" />
                            <span className="text-xs text-yellow-600 font-medium">Admin</span>
                          </div>
                        )}
                        {student.isProtected && student.rollNo !== ADMIN_STUDENT.rollNo && (
                          <div className="flex items-center gap-1">
                            <Lock className="w-3 h-3 text-blue-600" />
                            <span className="text-xs text-blue-600 font-medium">Protected</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">Roll No: {student.rollNo}</p>
                      {student.isProtected && (
                        <p className="text-xs text-gray-500">Password required</p>
                      )}
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No students found matching "{searchQuery}"</p>
              </div>
            )}
          </div>

          {/* Footer Note */}
          <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              <strong>Note:</strong> Students with <Lock className="w-3 h-3 inline mx-1" /> require password authentication.
              Click on any student to access their profile.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
