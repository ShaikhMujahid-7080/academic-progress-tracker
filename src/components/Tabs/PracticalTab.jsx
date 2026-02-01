import { PracticalCard } from "../Cards/PracticalCard";
import { subjects } from "../../data/subjects";
import { useNoticeBoard } from "../hooks/useNoticeBoard";

export function PracticalTab({ semester, allData, handleDataChange, selectedStudent }) {
  // Get notices to check for TODO-based lab completions
  const { notices, toggleTodo } = useNoticeBoard(selectedStudent, semester);

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Practical Subjects</h2>
        <p className="text-gray-600">Semester {semester} • {subjects[semester].practical.length} labs</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {subjects[semester].practical.map((subj) => (
          <PracticalCard
            key={`${semester}-${subj}`}
            subject={subj}
            onDataChange={(subject, data) => handleDataChange(subject, data, 'practical')}
            initialData={allData[`${semester}-${subj}`]?.data}
            notices={notices}
            onToggleTodo={toggleTodo}
            currentUserRollNo={selectedStudent?.rollNo}
          />
        ))}
      </div>
    </>
  );
}
