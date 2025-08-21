import { PracticalCard } from "../Cards/PracticalCard";
import { subjects } from "../../data/subjects";

export function PracticalTab({ semester, allData, handleDataChange }) { // Remove dataVersion
  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Practical Subjects</h2>
        <p className="text-gray-600">Semester {semester} • {subjects[semester].practical.length} labs</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {subjects[semester].practical.map((subj) => (
          <PracticalCard
            key={`${semester}-${subj}`} // Stable key - only changes when semester/subject changes
            subject={subj}
            onDataChange={(subject, data) => handleDataChange(subject, data, 'practical')}
            initialData={allData[`${semester}-${subj}`]?.data}
          />
        ))}
      </div>
    </>
  );
}
