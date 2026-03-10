import { useState, useEffect, memo } from "react";
import { BookOpen, Target, Award, Calculator } from "lucide-react";
import { caOptions } from "../../data/subjects";

export const TheoryCard = memo(function TheoryCard({ subject, subjectConfig, onDataChange, initialData, assessmentNotices = [] }) {
  const caCount = subjectConfig?.caCount || 4;

  const getInitialState = () => {
    const defaultState = {};
    for (let i = 1; i <= caCount; i++) {
      defaultState[`ca${i}`] = { type: '', date: '', marks: '', source: null };
    }
    defaultState.midSem = { date: '', marks: '', source: null };
    return defaultState;
  };

  const [caData, setCaData] = useState(getInitialState());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (initialData) {
      setCaData(prev => ({ ...getInitialState(), ...initialData }));
    }
  }, [initialData, caCount]);

  // Auto-fill and Sync logic from assessment notices
  useEffect(() => {
    // 1. Identify all current relevant assessments from notices
    const assessmentsFromNotices = {};

    assessmentNotices.forEach(notice => {
      const assessments = notice.meta?.assessments || [];
      assessments.forEach(assessment => {
        if (assessment.subject?.toLowerCase().trim() === subject?.toLowerCase().trim()) {
          const type = assessment.assessmentType;
          const key = type?.toLowerCase().replace('-', '');
          let targetKey = key;
          if (key === 'midsem') targetKey = 'midSem';

          if (caData[targetKey]) {
            assessmentsFromNotices[targetKey] = {
              date: assessment.date ? assessment.date.split('T')[0] : '',
              type: assessment.assessmentName || ''
            };
          }
        }
      });
    });

    // 2. Determine if state needs updating
    let hasChanges = false;
    const newData = { ...caData };

    // Check all keys (ca1, ca2, ca3, ca4, midSem)
    Object.keys(newData).forEach(key => {
      const noticeInfo = assessmentsFromNotices[key];
      const currentField = newData[key];

      if (noticeInfo) {
        // CASE: Notice exists for this field
        // Only update if: 
        // a) Currently empty 
        // b) Was previously set by a notice (and notice might have changed)
        // c) Forced sync - we'll prioritize notice over manual if they conflict and notice is present?
        // Actually, to be safe: update if empty OR if source is 'notice'
        if ((!currentField.date && noticeInfo.date) ||
          (!currentField.type && noticeInfo.type && key !== 'midSem') ||
          (currentField.source === 'notice' && (currentField.date !== noticeInfo.date || (key !== 'midSem' && currentField.type !== noticeInfo.type)))) {

          newData[key] = {
            ...currentField,
            date: noticeInfo.date,
            type: key === 'midSem' ? currentField.type : noticeInfo.type,
            source: 'notice'
          };
          hasChanges = true;
        }
      } else {
        // CASE: NO notice exists for this field
        // If it was previously set by a notice, CLEAR it
        if (currentField.source === 'notice') {
          newData[key] = {
            ...currentField,
            date: '',
            type: '',
            source: null
          };
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      setCaData(newData);
      // Note: we intentionally do NOT call onDataChange here.
      // The notice-sync effect only updates local UI state (e.g. auto-filling
      // date/type from a posted assessment). Persisting to Firestore is the
      // user's responsibility via the normal updateCA flow, which prevents
      // stale caData snapshots from overwriting already-saved marks.
    }
  }, [assessmentNotices, subject]);

  const updateCA = (caNum, field, value) => {
    // Validate marks input
    if (field === 'marks' && value !== '') {
      const numValue = parseFloat(value);
      const maxMarks = caNum === 'midSem' ? 20 : 10;

      // Prevent values less than 0 or greater than max
      if (numValue < 0 || numValue > maxMarks) {
        return; // Don't update if invalid
      }
    }

    const newData = {
      ...caData,
      [caNum]: {
        ...caData[caNum],
        [field]: value,
        // Coerce undefined→null; old Firestore docs were saved without `source`
        // and Firestore rejects undefined field values outright.
        source: (field === 'date' || field === 'type') ? 'manual' : (caData[caNum].source ?? null)
      }
    };
    setCaData(newData);
    onDataChange && onDataChange(subject, newData);
  };

  const calculateProgress = () => {
    const totalFields = (caCount * 3) + 2; // (type, date, marks) per CA + (date, marks) for midSem
    let filledFields = 0;
    Array.from({ length: caCount }, (_, i) => `ca${i + 1}`).forEach(ca => {
      if (caData[ca]?.type) filledFields++;
      if (caData[ca]?.date) filledFields++;
      if (caData[ca]?.marks) filledFields++;
    });
    if (caData.midSem?.date) filledFields++;
    if (caData.midSem?.marks) filledFields++;
    return Math.round((filledFields / totalFields) * 100);
  };

  // Calculate total internal marks
  const calculateTotalMarks = () => {
    let total = 0;
    Array.from({ length: caCount }, (_, i) => `ca${i + 1}`).forEach(ca => {
      if (caData[ca]) {
        const marks = parseFloat(caData[ca].marks);
        if (!isNaN(marks)) total += marks;
      }
    });
    const midSemMarks = parseFloat(caData.midSem?.marks);
    if (!isNaN(midSemMarks)) total += midSemMarks;
    return total;
  };

  const progress = calculateProgress();
  const totalMarks = calculateTotalMarks();

  // Color Status Helpers
  const getCAStatus = (data) => {
    if (data?.marks && data.marks !== '') return 'completed';
    if (data?.date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const examDate = new Date(data.date);
      if (examDate < today) return 'expired';
    }
    return 'pending';
  };

  const getStatusStyles = (status, isMidSem = false) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200 ring-1 ring-green-100';
      case 'expired':
        return 'bg-red-50 border-red-200 ring-1 ring-red-100';
      default:
        return isMidSem ? 'bg-orange-50 border-orange-100' : 'bg-white border-gray-100';
    }
  };

  const getStatusTextStyles = (status, isMidSem = false) => {
    switch (status) {
      case 'completed': return 'text-green-700';
      case 'expired': return 'text-red-700';
      default: return isMidSem ? 'text-orange-900' : 'text-gray-800';
    }
  };

  const getLabelStyles = (status, isMidSem = false) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'expired': return 'text-red-400';
      default: return isMidSem ? 'text-orange-400' : 'text-gray-400';
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Header with progress and total marks */}
      <div
        className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6" />
            <h3 className="text-lg font-bold">{subject}</h3>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm opacity-90">{progress}%</div>
            <div className="w-12 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Total Internal Marks */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm opacity-90">
            <Calculator className="w-4 h-4" />
            <span>Internal Assessment</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-lg font-bold">
                {totalMarks}/{(caCount * 10) + 20}
              </div>
            </div>
            {/* Edit Toggle Icon */}
            <div className="bg-white/20 p-1.5 rounded-lg hover:bg-white/30 transition-colors">
              {isExpanded ? <Target className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
            </div>
          </div>
        </div>
      </div>

      {/* Compact View (Summary) */}
      {!isExpanded && (
        <div className="p-4 bg-gray-50/50 cursor-pointer" onClick={() => setIsExpanded(true)}>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center">
            {Array.from({ length: caCount }, (_, i) => `ca${i + 1}`).map((key, index) => {
              const status = getCAStatus(caData[key]);
              return (
                <div key={key} className={`flex flex-col items-center p-2 rounded-xl border shadow-sm transition-colors ${getStatusStyles(status)}`}>
                  <span className={`text-xs font-bold uppercase tracking-wider mb-1 ${getLabelStyles(status)}`}>CA-{index + 1}</span>
                  <span className={`font-mono font-bold text-lg ${getStatusTextStyles(status)}`}>
                    {caData[key].marks || '0'}
                  </span>
                </div>
              );
            })}
            {(() => {
              const status = getCAStatus(caData.midSem);
              return (
                <div className={`flex flex-col items-center p-2 rounded-xl border shadow-sm transition-colors ${getStatusStyles(status, true)}`}>
                  <span className={`text-xs font-bold uppercase tracking-wider mb-1 ${getLabelStyles(status, true)}`}>Mid</span>
                  <span className={`font-mono font-bold text-lg ${getStatusTextStyles(status, true)}`}>
                    {caData.midSem.marks || '0'}
                  </span>
                </div>
              );
            })()}
          </div>
          <div className="mt-3 text-center">
            <span className="text-xs font-medium text-blue-500 hover:text-blue-600 transition-colors uppercase tracking-widest border-b border-dashed border-blue-300 pb-0.5">
              Tap card to edit details
            </span>
          </div>
        </div>
      )}

      {/* Expanded View (Full Form) */}
      {isExpanded && (
        <div className="p-6 space-y-6 animate-in slide-in-from-top-4 duration-300">
          {/* Continuous Assessments */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <Target className="w-4 h-4" />
              Continuous Assessment ({caCount} × 10 = {caCount * 10} marks)
            </h4>

            {Array.from({ length: caCount }, (_, i) => i + 1).map((num) => {
              const key = `ca${num}`;
              const status = getCAStatus(caData[key]);
              return (
                <div key={num} className={`rounded-2xl p-4 space-y-3 border transition-all ${getStatusStyles(status)} hover:shadow-md`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-bold ${getStatusTextStyles(status)}`}>CA-{num}</span>
                    {caData[key]?.marks && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold">
                        {caData[key]?.marks}/10
                      </span>
                    )}
                    {status === 'expired' && (
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold uppercase tracking-tight">
                        Date Passed
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <select
                      className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white font-medium"
                      value={caData[key]?.type || ''}
                      onChange={(e) => updateCA(key, 'type', e.target.value)}
                    >
                      <option value="">Select Type</option>
                      {caOptions.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>

                    <input
                      type="date"
                      className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-medium ${status === 'expired' ? 'border-red-200 bg-red-50/30' : 'border-gray-200 bg-white'}`}
                      value={caData[key]?.date || ''}
                      onChange={(e) => updateCA(key, 'date', e.target.value)}
                    />

                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.5"
                      placeholder="Marks (0-10)"
                      className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-bold ${status === 'completed' ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-white'}`}
                      value={caData[key]?.marks || ''}
                      onChange={(e) => updateCA(key, 'marks', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === '+') e.preventDefault();
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mid Semester */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
              <Award className="w-4 h-4" />
              Mid Semester Exam (20 marks)
            </h4>

            {(() => {
              const status = getCAStatus(caData.midSem);
              return (
                <div className={`rounded-2xl p-4 border transition-all ${getStatusStyles(status, true)} hover:shadow-md`}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`font-bold ${getStatusTextStyles(status, true)}`}>Mid-Sem Exam</span>
                    {caData.midSem.marks && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-bold">
                        {caData.midSem.marks}/20
                      </span>
                    )}
                    {status === 'expired' && (
                      <span className="text-[10px] bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold uppercase tracking-tight">
                        Date Passed
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="date"
                      className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-medium ${status === 'expired' ? 'border-red-200 bg-red-50/30' : 'border-gray-200 bg-white'}`}
                      value={caData.midSem.date}
                      onChange={(e) => updateCA('midSem', 'date', e.target.value)}
                    />

                    <input
                      type="number"
                      min="0"
                      max="20"
                      step="0.5"
                      placeholder="Marks (0-20)"
                      className={`w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all font-bold ${status === 'completed' ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-white'}`}
                      value={caData.midSem.marks}
                      onChange={(e) => updateCA('midSem', 'marks', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === '-' || e.key === '+') e.preventDefault();
                      }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(false);
            }}
            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold rounded-xl transition-colors uppercase tracking-wide text-sm"
          >
            Done Editing
          </button>
        </div>
      )}
    </div>
  );
});
