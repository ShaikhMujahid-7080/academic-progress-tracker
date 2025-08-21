import { GraduationCap, Calendar, Cloud, CloudOff, Loader2, CheckCircle, User, Crown } from "lucide-react";

export function Header({ semester, syncStatus, selectedStudent, onStudentSwitch }) {
  const { isOnline, isSyncing, lastSynced } = syncStatus;

  return (
    <div className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Academic Progress Tracker</h1>
              <p className="text-sm text-gray-600">Semester {semester} • Track your academic journey</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Current Student */}
            {selectedStudent && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{selectedStudent.name}</span>
                    {selectedStudent.rollNo === "2405225" && (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    )}
                  </div>
                  <span className="text-xs text-gray-600">Roll: {selectedStudent.rollNo}</span>
                </div>
                <button
                  onClick={onStudentSwitch}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                  title="Switch Student"
                >
                  <User className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            )}
            
            {/* Sync Status */}
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2">
                {isSyncing ? (
                  <div className="flex items-center gap-2 text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Syncing...</span>
                  </div>
                ) : isOnline ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <Cloud className="w-4 h-4" />
                    <span className="text-sm">Online</span>
                    {lastSynced && <CheckCircle className="w-3 h-3" />}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-orange-600">
                    <CloudOff className="w-4 h-4" />
                    <span className="text-sm">Offline</span>
                  </div>
                )}
              </div>
              
              {lastSynced && (
                <div className="text-xs text-gray-500">
                  Last synced: {lastSynced.toLocaleTimeString()}
                </div>
              )}
            </div>

            {/* Academic Year */}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Academic Year 2024-25</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
