import { GraduationCap, Calendar, Cloud, CloudOff, Loader2, CheckCircle, User, Crown, Settings, LogOut } from "lucide-react";

export function Header({ semester, syncStatus, selectedStudent, onStudentSwitch, onNavigate }) {
  const { isOnline, isSyncing, lastSynced } = syncStatus;

  return (
    <div className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-2 sm:py-3">
        {/* Mobile Layout (< sm) */}
        <div className="flex flex-col gap-2 sm:hidden">
          {/* Top Row: Logo/Title & Student Switcher */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-gray-900 truncate leading-tight">Academic Tracker</h1>
                <p className="text-xs text-gray-500 truncate">Semester {semester}</p>
              </div>
            </div>

            {selectedStudent && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate(4)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 bg-white rounded-full border border-gray-200 active:scale-95 transition-all shadow-sm group"
                  title="Profile Page"
                >
                  <div className="relative">
                    <div className="w-8 h-8 bg-white border border-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                      {selectedStudent.photoURL ? (
                        <img src={selectedStudent.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-blue-600 rounded-full flex items-center justify-center border border-white text-white text-[7px] font-bold shadow-sm">
                      {selectedStudent.name.charAt(0)}
                    </div>
                  </div>
                  <div className="text-xs font-semibold text-gray-900 truncate max-w-[70px]">
                    {selectedStudent.name.split(' ')[0]}
                  </div>
                  <Settings className="w-3 h-3 text-gray-400 group-hover:rotate-90 transition-transform" />
                </button>
                <button
                  onClick={onStudentSwitch}
                  className="p-2 bg-gray-50 rounded-full border border-gray-200 active:scale-95 transition-all shadow-sm"
                  title="Switch Student"
                >
                  <LogOut className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            )}
          </div>

          {/* Bottom Row: Sync, Year, Roll No */}
          <div className="flex items-center justify-between text-xs border-t border-gray-100 pt-1.5">
            <div className="flex items-center gap-3">
              {/* Sync Status */}
              {isSyncing ? (
                <div className="flex items-center gap-1.5 text-blue-600 font-medium">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Syncing...</span>
                </div>
              ) : isOnline ? (
                <div className="flex items-center gap-1.5 text-green-600 font-medium">
                  <div className="relative">
                    <Cloud className="w-3.5 h-3.5" />
                    {lastSynced && <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-500 rounded-full border border-white" />}
                  </div>
                  <span>Online</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-orange-600 font-medium">
                  <CloudOff className="w-3.5 h-3.5" />
                  <span>Offline</span>
                </div>
              )}

              <div className="w-px h-3 bg-gray-300"></div>

              <div className="text-gray-500">
                {(() => {
                  const now = new Date();
                  const year = now.getFullYear();
                  const startYear = now.getMonth() >= 5 ? year : year - 1;
                  return `${startYear}-${(startYear + 1).toString().slice(-2)}`;
                })()}
              </div>
            </div>

            {selectedStudent && (
              <span className="text-gray-400 font-mono">#{selectedStudent.rollNo}</span>
            )}
          </div>
        </div>

        {/* Desktop/Tablet Layout (>= sm) */}
        <div className="hidden sm:flex items-center justify-between gap-6">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
              <GraduationCap className="w-6 h-6 md:w-7 md:h-7 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">Academic Progress Tracker</h1>
              <p className="text-sm text-gray-600 truncate">Academic Portfolio & Profile Portal</p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4 md:gap-8">
            {/* Academic Year */}
            <div className="hidden md:flex flex-col items-end text-right">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Academic Year</span>
              <span className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-500" />
                {(() => {
                  const now = new Date();
                  const year = now.getFullYear();
                  const startYear = now.getMonth() >= 5 ? year : year - 1;
                  return `${startYear}-${(startYear + 1).toString().slice(-2)}`;
                })()}
              </span>
            </div>

            {/* Sync Status */}
            <div className="flex flex-col items-end gap-0.5">
              <div className="flex items-center gap-2 text-sm">
                {isSyncing ? (
                  <div className="flex items-center gap-1.5 text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Syncing...</span>
                  </div>
                ) : isOnline ? (
                  <div className="flex items-center gap-1.5 text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Online</span>
                    {lastSynced && <CheckCircle className="w-3 h-3 ml-1" />}
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-orange-600 font-medium bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                    <CloudOff className="w-3.5 h-3.5" />
                    <span>Offline</span>
                  </div>
                )}
              </div>
              {lastSynced && (
                <div className="text-[10px] text-gray-400 font-medium">
                  Synced: {lastSynced.toLocaleTimeString()}
                </div>
              )}
            </div>

            {/* Current Student */}
            {selectedStudent && (
              <>
                <div className="flex items-center gap-4">
                  <button
                    onClick={onStudentSwitch}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-50 text-gray-500 rounded-xl hover:bg-orange-50 hover:text-orange-600 border border-transparent hover:border-orange-100 transition-all font-medium text-sm group"
                    title="Switch Student Profile"
                  >
                    <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    <span>Switch</span>
                  </button>

                  <div className="w-px h-8 bg-gray-200"></div>

                  <button
                    onClick={() => onNavigate(4)}
                    className="flex items-center gap-3 p-1.5 pr-4 bg-gray-50 hover:bg-blue-50 rounded-2xl border border-transparent hover:border-blue-100 transition-all active:scale-[0.98] group relative"
                    title="View & manage your profile"
                  >
                    <div className="relative">
                      <div className="w-10 h-10 bg-white border-2 border-gray-100 rounded-xl flex items-center justify-center shadow-sm overflow-hidden group-hover:border-blue-200 transition-colors">
                        {selectedStudent.photoURL ? (
                          <img src={selectedStudent.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white text-white text-[10px] font-bold shadow-sm">
                        {selectedStudent.name.charAt(0)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <span className="text-sm font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{selectedStudent.name}</span>
                        {selectedStudent.rollNo === "2405225" && (
                          <Crown className="w-3.5 h-3.5 text-yellow-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <span className="text-[10px] text-gray-400 font-mono bg-white px-1.5 py-0.5 rounded border border-gray-100">
                          #{selectedStudent.rollNo}
                        </span>
                        <Settings className="w-3 h-3 text-gray-300 group-hover:text-blue-400 group-hover:rotate-45 transition-all" />
                      </div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
