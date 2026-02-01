import { useState, useMemo } from "react";
import { GraduationCap, Users, Crown, User, Loader2, Search, X, Lock, Shield, Sun, Moon } from "lucide-react";
import { ADMIN_STUDENT } from "../../data/subjects";
import { getStudentYear } from "../../utils/studentUtils";

export function StudentSelectionScreen({ students, onStudentSelect, isLoading, studentManagement, theme, onThemeToggle }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showPasswordAuth, setShowPasswordAuth] = useState(false);
  const [selectedStudentForAuth, setSelectedStudentForAuth] = useState(null);
  const [password, setPassword] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState("");

  const isDark = theme === 'dark';

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
      <div className="w-full flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className={`absolute inset-0 blur-2xl opacity-20 animate-pulse ${isDark ? 'bg-blue-500' : 'bg-blue-600'}`} />
            <GraduationCap className={`w-20 h-20 relative z-10 ${isDark ? 'text-white' : 'text-blue-600'}`} />
          </div>
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-white/80' : 'text-blue-600'}`} />
              <h1 className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Initializing Portal...</h1>
            </div>
            <p className={`font-medium tracking-wide ${isDark ? 'text-blue-100/60' : 'text-gray-500'}`}>Syncing with MGM University Databases</p>
          </div>
        </div>
      </div>
    );
  }

  // Password Authentication Modal
  if (showPasswordAuth && selectedStudentForAuth) {
    return (
      <div className="w-full max-w-md animate-in fade-in zoom-in duration-300 px-4">
        <div className={`
          ${isDark ? 'glass-card' : 'glass-card-light'} 
          rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden group
        `}>
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 blur-3xl transition-all duration-500 ${isDark ? 'bg-white/5 group-hover:bg-white/10' : 'bg-blue-500/5 group-hover:bg-blue-500/10'}`} />

          {/* Header */}
          <div className="text-center mb-8 relative z-10">
            <div className={`
              w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg transition-transform duration-500 group-hover:scale-110
              ${selectedStudentForAuth.rollNo === ADMIN_STUDENT.rollNo
                ? 'bg-gradient-to-br from-amber-400 to-orange-600'
                : 'bg-gradient-to-br from-blue-500 to-indigo-700'
              }
            `}>
              {selectedStudentForAuth.rollNo === ADMIN_STUDENT.rollNo ? (
                <Crown className="w-10 h-10 text-white drop-shadow-md" />
              ) : (
                <Lock className="w-10 h-10 text-white drop-shadow-md" />
              )}
            </div>
            <h2 className={`text-3xl font-black mb-2 tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {selectedStudentForAuth.rollNo === ADMIN_STUDENT.rollNo
                ? 'Admin Access'
                : 'Account Locked'
              }
            </h2>
            <p className={`${isDark ? 'text-white/60' : 'text-gray-500'} font-medium`}>
              Enter credentials for {selectedStudentForAuth.name}
            </p>
          </div>

          {/* Student Info */}
          <div className={`mb-8 p-5 backdrop-blur-md rounded-[1.5rem] border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-100'}`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-blue-100'}`}>
                <User className={`w-6 h-6 ${isDark ? 'text-white' : 'text-blue-600'}`} />
              </div>
              <div className="min-w-0">
                <p className={`font-bold text-lg truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedStudentForAuth.name}</p>
                <p className={`text-sm font-mono tracking-wider ${isDark ? 'text-white/50' : 'text-gray-400'}`}>ID: {selectedStudentForAuth.rollNo}</p>
              </div>
            </div>
          </div>

          {/* Password Form */}
          <form onSubmit={handlePasswordAuth} className="space-y-6">
            <div className="relative group/input">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center transition-colors">
                <Shield className={`w-5 h-5 transition-colors ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
              </div>
              <input
                type="password"
                placeholder="Secure Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`
                  w-full pl-12 pr-4 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium
                  ${isDark
                    ? 'bg-white/5 border border-white/10 text-white placeholder-white/30 focus:bg-white/10'
                    : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white'
                  }
                `}
                required
                disabled={isAuthenticating}
                autoFocus
              />
            </div>

            {authError && (
              <div className={`p-3 border rounded-xl text-sm font-medium flex items-center gap-2 ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-100 text-red-600'}`}>
                <X className="w-4 h-4" />
                {authError}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={isAuthenticating || !password.trim()}
                className={`
                  w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-white transition-all shadow-xl hover:shadow-2xl active:scale-[0.98] disabled:opacity-50
                  ${selectedStudentForAuth.rollNo === ADMIN_STUDENT.rollNo
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                  }
                `}
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Verifying Identity...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Unlock Account</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={cancelPasswordAuth}
                disabled={isAuthenticating}
                className={`w-full py-4 font-bold transition-colors ${isDark ? 'text-white/40 hover:text-white/80' : 'text-gray-400 hover:text-gray-600'}`}
              >
                Go Back
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-700 px-4 relative">
      {/* Theme Toggle Button */}
      <div className="absolute top-0 right-4 z-20">
        <button
          onClick={onThemeToggle}
          className={`
            p-3 rounded-2xl transition-all shadow-lg hover:scale-110 active:scale-95
            ${isDark
              ? 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
              : 'bg-white text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-blue-500/10'
            }
          `}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        >
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
        </button>
      </div>

      {/* Hero Header */}
      <div className="text-center mb-12 relative">
        <div className="relative inline-block mb-8 group">
          <div className={`absolute inset-0 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000 ${isDark ? 'bg-blue-400' : 'bg-blue-600'}`} />
          <div className={`
            w-24 h-24 backdrop-blur-2xl rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl transform transition-transform group-hover:scale-110 group-hover:rotate-6 duration-500 border
            ${isDark ? 'bg-white/10 border-white/10' : 'bg-white border-blue-100'}
          `}>
            <GraduationCap className={`w-12 h-12 drop-shadow-md ${isDark ? 'text-white' : 'text-blue-600'}`} />
          </div>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tighter px-2">
          <span className={`bg-clip-text text-transparent bg-gradient-to-r ${isDark ? 'from-blue-200 via-white to-indigo-200' : 'from-blue-600 via-indigo-700 to-purple-800'}`}>
            Academic Progress
          </span>
          <br />
          <span className={`bg-clip-text text-transparent bg-gradient-to-r ${isDark ? 'from-blue-400 to-indigo-400' : 'from-blue-500 to-indigo-600'}`}>
            Tracker Portal
          </span>
        </h1>
        <p className={`font-medium text-lg max-w-md mx-auto leading-relaxed ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
          The unified digital portal for MGM University engineering students. Select your identity to begin.
        </p>
      </div>

      {/* Main Selection Card */}
      <div className={`
        ${isDark ? 'glass-card' : 'glass-card-light'} 
        rounded-[3rem] p-4 md:p-10 shadow-2xl relative
      `}>
        <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-blue-500/30 to-transparent rounded-full ${isDark ? 'opacity-50' : 'opacity-30'}`} />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 px-4 pt-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ring-1 ${isDark ? 'bg-blue-500/20 ring-white/10' : 'bg-blue-100 ring-blue-200'}`}>
              <Users className={`w-6 h-6 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
            <div>
              <h2 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Student Profiles</h2>
              <span className={`text-sm font-bold tracking-widest uppercase ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{students.length} Registered</span>
            </div>
          </div>

          {/* Modern Search Bar */}
          <div className="relative group/search flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className={`w-5 h-5 transition-colors ${isDark ? 'text-slate-500 group-focus-within/search:text-blue-400' : 'text-gray-400'}`} />
            </div>
            <input
              type="text"
              placeholder="Filter by name or roll..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`
                w-full pl-12 pr-12 py-4 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium
                ${isDark
                  ? 'bg-slate-900/40 border-white/5 text-white placeholder-slate-500 focus:bg-slate-900/60'
                  : 'bg-gray-50 border-gray-100 text-gray-900 placeholder-gray-400 focus:bg-white'
                }
              `}
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className={`absolute inset-y-0 right-0 pr-4 flex items-center transition-colors ${isDark ? 'text-slate-500 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Responsive Grid List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide p-2">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <button
                key={student.rollNo}
                onClick={() => handleStudentClick(student)}
                className={`
                  w-full flex items-center p-5 rounded-[1.75rem] border transition-all text-left hover-lift relative group/student
                  ${isDark
                    ? student.rollNo === ADMIN_STUDENT.rollNo
                      ? 'border-amber-500/30 bg-amber-500/5 hover:border-amber-400 hover:bg-amber-500/10'
                      : student.isProtected
                        ? 'border-indigo-500/30 bg-indigo-500/5 hover:border-indigo-400 hover:bg-indigo-500/10'
                        : 'border-white/5 bg-white/5 hover:border-blue-400/30 hover:bg-white/10'
                    : student.rollNo === ADMIN_STUDENT.rollNo
                      ? 'border-amber-200 bg-amber-50/50 hover:border-amber-400 hover:bg-amber-50'
                      : student.isProtected
                        ? 'border-blue-200 bg-blue-50/50 hover:border-blue-400 hover:bg-blue-50'
                        : 'border-gray-100 bg-gray-50/50 hover:border-blue-300 hover:bg-white hover:shadow-lg hover:shadow-blue-500/5'
                  }
                `}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className={`
                    w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner shrink-0 scale-95 group-hover/student:scale-100 transition-transform duration-300
                    ${student.rollNo === ADMIN_STUDENT.rollNo
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-amber-950 shadow-lg shadow-amber-500/20'
                      : student.isProtected
                        ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-lg shadow-indigo-500/20'
                        : isDark ? 'bg-white/10 text-slate-300' : 'bg-blue-100 text-blue-600'
                    }
                  `}>
                    {student.rollNo === ADMIN_STUDENT.rollNo ? (
                      <Crown className="w-7 h-7" />
                    ) : student.isProtected ? (
                      <Lock className="w-7 h-7" />
                    ) : (
                      <User className="w-7 h-7" />
                    )}
                  </div>

                  <div className="min-w-0 pr-2">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <h3 className={`font-bold text-lg leading-tight truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{student.name}</h3>
                      {student.rollNo === ADMIN_STUDENT.rollNo && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider border ${isDark ? 'bg-amber-400/20 text-amber-300 border-amber-400/30' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                          Admin
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {student.admissionYear && (
                        <span className={`text-[10px] font-black uppercase tracking-tighter px-2.5 py-1 rounded-lg border ${isDark ? 'text-blue-300 bg-blue-500/20 border-blue-500/20' : 'text-blue-600 bg-blue-50 border-blue-100'}`}>
                          {getStudentYear(student)}
                        </span>
                      )}
                      <span className={`text-sm font-bold tracking-wide ${isDark ? 'text-slate-500 font-mono' : 'text-gray-600'}`}>ROLL: {student.rollNo}</span>
                    </div>
                  </div>

                  {student.isProtected && (
                    <div className={`ml-auto transition-opacity ${isDark ? 'opacity-40 group-hover/student:opacity-100' : 'text-blue-400'}`}>
                      <Shield className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </button>
            ))
          ) : (
            <div className={`col-span-full text-center py-20 rounded-3xl border border-dashed ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
              <Users className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-white/5' : 'text-gray-200'}`} />
              <p className={`font-bold text-xl ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>No profiles match your search</p>
              <button
                onClick={clearSearch}
                className="mt-4 text-blue-500 font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className={`mt-8 p-6 backdrop-blur-md rounded-[2rem] border mx-2 ${isDark ? 'bg-slate-900/40 border-white/5 text-slate-400' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
          <div className="flex items-center gap-3 text-sm font-medium leading-relaxed justify-center md:justify-start">
            <Lock className={`w-4 h-4 shrink-0 ${isDark ? 'text-blue-400/60' : 'text-blue-500'}`} />
            <p className="text-center md:text-left">
              Secure authentication enabled. Profiles marked with <Lock className="w-3 h-3 inline mx-0.5 mb-1" />
              require unique passwords managed by the administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
