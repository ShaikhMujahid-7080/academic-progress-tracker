import { GraduationCap, Calendar, Cloud, CloudOff, Loader2, CheckCircle, User, Crown } from "lucide-react";

export function Header({ semester, syncStatus, selectedStudent, onStudentSwitch }) {
  const { isOnline, isSyncing, lastSynced } = syncStatus;

  return (
    <div className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 md:gap-6">
          {/* Logo and Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">Academic Progress Tracker</h1>
              <p className="text-xs sm:text-sm text-gray-600 truncate">Semester {semester} • Track your academic journey</p>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-2 md:gap-6 min-w-0">
            {/* Current Student */}
            {selectedStudent && (
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="text-right min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2 justify-end">
                    <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">{selectedStudent.name}</span>
                    {selectedStudent.rollNo === "2405225" && (
                      <Crown className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500 flex-shrink-0" />
                    )}
                  </div>
                  <span className="text-xs text-gray-600 block truncate">Roll: {selectedStudent.rollNo}</span>
                </div>
                <button
                  onClick={onStudentSwitch}
                  className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-xl transition-colors flex-shrink-0"
                  title="Switch Student"
                >
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>
              </div>
            )}

            {/* Sync Status */}
            <div className="flex flex-col items-start sm:items-end gap-0.5 sm:gap-1">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                {isSyncing ? (
                  <div className="flex items-center gap-1 sm:gap-2 text-blue-600">
                    <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 animate-spin flex-shrink-0" />
                    <span className="truncate">Syncing...</span>
                  </div>
                ) : isOnline ? (
                  <div className="flex items-center gap-1 sm:gap-2 text-green-600">
                    <Cloud className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">Online</span>
                    {lastSynced && <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3 flex-shrink-0" />}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 sm:gap-2 text-orange-600">
                    <CloudOff className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">Offline</span>
                  </div>
                )}
              </div>

              {lastSynced && (
                <div className="text-xs text-gray-500 truncate">
                  Last synced: {lastSynced.toLocaleTimeString()}
                </div>
              )}
            </div>

            {/* Academic Year */}
            <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 flex-shrink-0">
              <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="truncate">
                Academic Year {(() => {
                  const now = new Date();
                  const year = now.getFullYear();
                  // Academic year starts from June (index 5)
                  const startYear = now.getMonth() >= 5 ? year : year - 1;
                  return `${startYear}-${(startYear + 1).toString().slice(-2)}`;
                })()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
