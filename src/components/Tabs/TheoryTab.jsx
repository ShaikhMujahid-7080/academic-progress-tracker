import { TheoryCard } from "../Cards/TheoryCard";

import { useNoticeBoard } from "../hooks/useNoticeBoard";
import { useMemo } from "react";

export function TheoryTab({ semester, allData, handleDataChange, selectedStudent, subjectsConfig }) {
  const { notices } = useNoticeBoard(selectedStudent, semester);
  const theorySubjects = subjectsConfig?.[semester]?.theory || [];

  // Filter for assessment notices only
  const assessmentNotices = useMemo(() => {
    return notices.filter(notice => notice.type === 'assessment');
  }, [notices]);

  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Theory Subjects</h2>
        <p className="text-gray-600">Semester {semester} • {theorySubjects.length} subjects</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {theorySubjects.map((subjObj, index) => {
          const subjName = subjObj.name;
          return (
            <TheoryCard
              key={`${semester}-${subjName}-${index}`}
              subject={subjName}
              subjectConfig={subjObj}
              onDataChange={(subject, data) => handleDataChange(subject, data, 'theory')}
              initialData={allData[`${semester}-${subjName}`]?.data}
              assessmentNotices={assessmentNotices}
            />
          );
        })}
      </div>
    </>
  );
}
