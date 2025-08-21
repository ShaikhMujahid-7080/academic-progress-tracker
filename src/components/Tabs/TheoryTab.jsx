import { TheoryCard } from "../Cards/TheoryCard";
import { subjects } from "../../data/subjects";

export function TheoryTab({ semester, allData, handleDataChange }) { // Remove dataVersion
  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Theory Subjects</h2>
        <p className="text-gray-600">Semester {semester} • {subjects[semester].theory.length} subjects</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {subjects[semester].theory.map((subj) => (
          <TheoryCard
            key={`${semester}-${subj}`} // Stable key - only changes when semester/subject changes
            subject={subj}
            onDataChange={(subject, data) => handleDataChange(subject, data, 'theory')}
            initialData={allData[`${semester}-${subj}`]?.data}
          />
        ))}
      </div>
    </>
  );
}
