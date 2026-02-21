import { PracticalCard } from "../Cards/PracticalCard";

import { useNoticeBoard } from "../hooks/useNoticeBoard";

export function PracticalTab({ semester, allData, handleDataChange, selectedStudent, subjectsConfig }) {
  // Get notices to check for TODO-based lab completions
  const { notices, toggleTodo } = useNoticeBoard(selectedStudent, semester);
  const practicalSubjects = subjectsConfig?.[semester]?.practical || [];

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Practical Subjects</h2>
        <p className="text-gray-600">Semester {semester} • {practicalSubjects.length} labs</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {practicalSubjects.map((subjObj, index) => {
          const subjName = subjObj.name;
          return (
            <PracticalCard
              key={`${semester}-${subjName}-${index}`}
              subject={subjName}
              subjectConfig={subjObj}
              onDataChange={(subject, data) => handleDataChange(subject, data, 'practical')}
              initialData={allData[`${semester}-${subjName}`]?.data}
              notices={notices}
              onToggleTodo={toggleTodo}
              currentUserRollNo={selectedStudent?.rollNo}
            />
          );
        })}
      </div>
    </>
  );
}
