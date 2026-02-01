import { useState, useEffect, useMemo, memo } from "react";
import { FlaskConical, CheckCircle2, Circle, Trophy, Sparkles } from "lucide-react";

// Wrap with memo
export const PracticalCard = memo(function PracticalCard({
  subject,
  onDataChange,
  initialData,
  notices = [],
  onToggleTodo,
  currentUserRollNo
}) {
  const [completedLabs, setCompletedLabs] = useState(new Set());

  useEffect(() => {
    if (initialData && Array.isArray(initialData)) {
      setCompletedLabs(new Set(initialData));
    }
  }, [initialData]);

  // Compute labs auto-completed via TODO notices
  const autoCompletedLabs = useMemo(() => {
    const autoMarked = new Set();

    if (!currentUserRollNo || !notices.length) return autoMarked;

    notices.forEach(notice => {
      if (
        notice.type === 'todo' &&
        notice.meta?.practicalSubject === subject &&
        notice.meta?.labNumber &&
        notice.meta?.completedBy?.includes(currentUserRollNo)
      ) {
        if (Array.isArray(notice.meta.labNumber)) {
          notice.meta.labNumber.forEach(num => autoMarked.add(Number(num)));
        } else {
          autoMarked.add(Number(notice.meta.labNumber));
        }
      }
    });

    return autoMarked;
  }, [notices, subject, currentUserRollNo]);

  // Merge manual and auto-completed labs
  const allCompletedLabs = useMemo(() => {
    return new Set([...completedLabs, ...autoCompletedLabs]);
  }, [completedLabs, autoCompletedLabs]);

  const toggleLab = (labNum) => {
    const isCurrentlyCompleted = allCompletedLabs.has(labNum);

    if (isCurrentlyCompleted) {
      // UNMARKING logic
      // 1. Remove from manual completions if present
      if (completedLabs.has(labNum)) {
        const newCompleted = new Set(completedLabs);
        newCompleted.delete(labNum);
        setCompletedLabs(newCompleted);
        onDataChange && onDataChange(subject, Array.from(newCompleted));
      }

      // 2. If it was linked to a TODO notice that is currently checked, uncheck that TODO
      if (onToggleTodo && currentUserRollNo) {
        notices.forEach(notice => {
          if (
            notice.type === 'todo' &&
            notice.meta?.practicalSubject === subject &&
            notice.meta?.labNumber &&
            notice.meta?.completedBy?.includes(currentUserRollNo)
          ) {
            let coversLab = false;
            if (Array.isArray(notice.meta.labNumber)) {
              coversLab = notice.meta.labNumber.some(n => Number(n) === labNum);
            } else {
              coversLab = Number(notice.meta.labNumber) === labNum;
            }

            if (coversLab) {
              onToggleTodo(notice.id, currentUserRollNo);
            }
          }
        });
      }
    } else {
      // MARKING logic
      // 1. Add to manual completions
      const newCompleted = new Set(completedLabs);
      newCompleted.add(labNum);
      setCompletedLabs(newCompleted);
      onDataChange && onDataChange(subject, Array.from(newCompleted));

      // 2. Auto-complete associated TODO notices if all their labs are now done
      if (onToggleTodo && currentUserRollNo) {
        notices.forEach(notice => {
          if (
            notice.type === 'todo' &&
            notice.meta?.practicalSubject === subject &&
            notice.meta?.labNumber &&
            !notice.meta?.completedBy?.includes(currentUserRollNo)
          ) {
            let coversLab = false;
            if (Array.isArray(notice.meta.labNumber)) {
              coversLab = notice.meta.labNumber.some(n => Number(n) === labNum);
            } else {
              coversLab = Number(notice.meta.labNumber) === labNum;
            }

            if (coversLab) {
              // Check if all needed labs for this notice are now in newCompleted
              let allNeededDone = true;
              if (Array.isArray(notice.meta.labNumber)) {
                allNeededDone = notice.meta.labNumber.every(n => newCompleted.has(Number(n)));
              } else {
                allNeededDone = true; // singular
              }

              if (allNeededDone) {
                onToggleTodo(notice.id, currentUserRollNo);
              }
            }
          }
        });
      }
    }
  };

  const progress = (allCompletedLabs.size / 10) * 100;

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-teal-600 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FlaskConical className="w-6 h-6" />
            <h3 className="text-lg font-bold">{subject}</h3>
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Practical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm opacity-90">{allCompletedLabs.size}/10</div>
            <div className="w-12 h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="p-6">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Lab Experiments ({allCompletedLabs.size}/10 completed)
          {autoCompletedLabs.size > 0 && (
            <span className="text-xs text-yellow-600 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {autoCompletedLabs.size} auto
            </span>
          )}
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => {
            const isAutoCompleted = autoCompletedLabs.has(num);
            const isCompleted = allCompletedLabs.has(num);

            return (
              <button
                key={num}
                onClick={() => toggleLab(num)}
                title={isAutoCompleted ? 'Auto-marked from TODO notice (Click to unmark both)' : undefined}
                className={`
                  flex items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 font-medium
                  ${isAutoCompleted
                    ? 'bg-yellow-100 border-yellow-500 text-yellow-700 shadow-md'
                    : isCompleted
                      ? 'bg-green-100 border-green-500 text-green-700 shadow-md'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  {isAutoCompleted ? (
                    <Sparkles className="w-4 h-4" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Circle className="w-4 h-4" />
                  )}
                  <span>Lab {num}</span>
                </div>
              </button>
            );
          })}
        </div>
        {progress === 100 && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
            <div className="flex items-center gap-2 text-green-700">
              <Trophy className="w-5 h-5" />
              <span className="font-medium">All labs completed! Great work! 🎉</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});
