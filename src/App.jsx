import { useState, useEffect } from "react";
import { StudentSelectionScreen } from "./components/UI/StudentSelectionScreen";
import { Header } from "./components/UI/Header";
import { TabNavigation } from "./components/UI/TabNavigation";
import { TabPanel } from "./components/UI/TabPanel";
import { TheoryTab } from "./components/Tabs/TheoryTab";
import { PracticalTab } from "./components/Tabs/PracticalTab";
import { NoticeBoardTab } from "./components/Tabs/NoticeBoardTab";
import { PersonalNotesTab } from "./components/Tabs/PersonalNotesTab";
import { StudentManagementTab } from "./components/Tabs/StudentManagementTab";
import { DegreeCompletionTab } from "./components/Tabs/DegreeCompletionTab";
import { AdminPrivilegesTab } from "./components/Tabs/AdminPrivilegesTab";
import { CalendarTab } from "./components/Tabs/CalendarTab";
import { useLocalStorage } from "./components/hooks/useLocalStorage";
import { ADMIN_STUDENT } from "./data/subjects";
import { useFirestore } from "./components/hooks/useFirestore";
import { useStudentManagement } from "./components/hooks/useStudentManagement";

export default function App() {
  const [tab, setTab] = useState(0);
  const [semester, setSemester] = useState(5);
  const [resettingData, setResettingData] = useState(false);

  // Student management
  const studentManagement = useStudentManagement();
  const {
    students,
    selectedStudent,
    isLoading: studentsLoading,
    hasInitialized,
    selectStudent
  } = studentManagement;

  // This key ensures local storage is always per selected student
  const studentKey = selectedStudent ? `academic-data-${selectedStudent.rollNo}` : 'academic-data-temp';
  const [allData, setAllData] = useLocalStorage(studentKey, {});

  // Firebase integration (now student-based)
  const studentId = selectedStudent?.rollNo;
  const { isOnline, isSyncing, lastSynced, saveToFirestore, loadAllData } = useFirestore(studentId);

  // Handle student switch: always clear first, then (only afterwards) load from Firestore if needed.
  useEffect(() => {
    let didCancel = false;

    // If no student: clear all data and stop
    if (!selectedStudent) {
      setAllData({});
      return;
    }

    // Step 1: Reset local state, ensure it's empty before load
    setResettingData(true);
    setAllData({});

    // Step 2: After a tiny delay (to guarantee React renders cleared state), load new data if online
    setTimeout(async () => {
      if (didCancel) return;
      if (isOnline && selectedStudent) {
        try {
          const firestoreData = await loadAllData();
          if (!didCancel) {
            if (firestoreData && Object.keys(firestoreData).length > 0) {
              setAllData(firestoreData);
            } // else remains empty
          }
        } catch (error) {
          if (!didCancel) {
            setAllData({});
          }
        }
      }
      if (!didCancel) setResettingData(false);
    }, 50);

    // Cleanup to avoid setState on unmounted component
    return () => { didCancel = true; };

    // eslint-disable-next-line
  }, [selectedStudent, isOnline]);

  // When a selected student is restored/changed, set the semester based on admission info (if available)
  // Helper to determine if student has completed 4 or more academic years since admission
  const hasCompletedFourYears = (student) => {
    if (!student || !student.admissionYear) return false;
    const now = new Date();
    const month = now.getMonth() + 1;
    const currentAcademicYearStart = month >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    const yearsPassed = currentAcademicYearStart - Number(student.admissionYear);
    return yearsPassed >= 4;
  };

  useEffect(() => {
    if (selectedStudent) {
      const defaultSem = computeDefaultSemester(selectedStudent);
      if (defaultSem) {
        setSemester(defaultSem);
      } else if (selectedStudent.isDSY) {
        // If we don't have a computable default (missing admissionYear), ensure DSY students cannot be below semester 3
        setSemester((s) => (s < 3 ? 3 : s));
      }

      // If the student has passed 4 academic years, switch to Degree Completion tab by default
      if (hasCompletedFourYears(selectedStudent)) {
        setTab(5);
      }

      // If degree tab is not applicable, ensure we are not on tab 5
      if (!hasCompletedFourYears(selectedStudent) && tab === 5) {
        setTab(0);
      }
    }
    // eslint-disable-next-line
  }, [selectedStudent]);

  // Handle data changes with automatic Firebase sync
  const handleDataChange = async (subject, data, type = 'theory') => {
    if (!selectedStudent) return;

    const key = `${semester}-${subject}`;
    const updatedItem = { data, type, semester, subject };

    const updatedData = {
      ...allData,
      [key]: updatedItem
    };
    setAllData(updatedData);

    if (isOnline) {
      try {
        await saveToFirestore(semester, subject, data, type);
      } catch (error) {
        console.error('Error syncing to Firestore:', error);
      }
    }
  };

  // Compute default semester from admission info (returns null if not enough info)
  // Uses academic-year boundaries: each academic year (e.g., 2024-25) has two semesters.
  // Academic year is considered to start in July (months July-Dec are the first semester, Jan-Jun the second).
  const computeDefaultSemester = (student) => {
    if (!student || !student.admissionYear) return null;
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12

    // Determine the start year of the current academic year
    const currentAcademicYearStart = month >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    const admissionAcademicYearStart = Number(student.admissionYear);

    // Number of full academic years passed since admission
    let yearsPassed = currentAcademicYearStart - admissionAcademicYearStart;
    if (yearsPassed < 0) yearsPassed = 0;

    const startSem = student.isDSY ? 3 : 1;
    // semesterIndex: 0 for first semester of academic year (July-Dec), 1 for second (Jan-Jun)
    const semesterIndex = month >= 7 ? 0 : 1;

    let sem = startSem + yearsPassed * 2 + semesterIndex;
    if (sem < startSem) sem = startSem;
    if (sem > 8) sem = 8;
    return sem;
  };

  // On student selection from selection screen, clear data immediately and set student
  const handleStudentSelection = (student) => {
    setAllData({});
    const defaultSem = computeDefaultSemester(student);
    if (defaultSem) setSemester(defaultSem);
    selectStudent(student);
  };

  // Show loading or student selection screen if no student selected OR resettingData is in progress
  if (!selectedStudent || studentsLoading || !hasInitialized || resettingData) {
    return (
      <StudentSelectionScreen
        students={students}
        onStudentSelect={handleStudentSelection}
        isLoading={studentsLoading || !hasInitialized || resettingData}
        studentManagement={studentManagement}
      />
    );
  }

  const syncStatus = { isOnline, isSyncing, lastSynced };

  // handle student switching (for header)
  const handleStudentSwitch = () => {
    selectStudent(null);
    localStorage.removeItem('selected-student');
    setAllData({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Header
        semester={semester}
        syncStatus={syncStatus}
        selectedStudent={selectedStudent}
        onStudentSwitch={handleStudentSwitch}
      />
      <TabNavigation
        activeTab={tab}
        onTabChange={setTab}
        showDegreeTab={hasCompletedFourYears(selectedStudent)}
        showAdminTab={selectedStudent?.rollNo === ADMIN_STUDENT.rollNo || selectedStudent?.role === 'co-leader'}
      />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <TabPanel value={tab} index={0}>
          <TheoryTab
            semester={semester}
            allData={allData}
            handleDataChange={handleDataChange}
          />
        </TabPanel>

        <TabPanel value={tab} index={1}>
          <PracticalTab
            semester={semester}
            allData={allData}
            handleDataChange={handleDataChange}
          />
        </TabPanel>

        <TabPanel value={tab} index={2}>
          <NoticeBoardTab
            selectedStudent={selectedStudent}
          />
        </TabPanel>

        <TabPanel value={tab} index={3}>
          <PersonalNotesTab
            selectedStudent={selectedStudent}
          />
        </TabPanel>

        <TabPanel value={tab} index={4}>
          <StudentManagementTab
            semester={semester}
            setSemester={setSemester}
            studentManagement={studentManagement}
          />
        </TabPanel>

        <TabPanel value={tab} index={5}>
          <DegreeCompletionTab selectedStudent={selectedStudent} />
        </TabPanel>

        <TabPanel value={tab} index={6}>
          <AdminPrivilegesTab
            selectedStudent={selectedStudent}
            studentManagement={studentManagement}
            onNavigateToTab={(tabIndex, options) => {
              setTab(tabIndex);
              // Handle options if needed (e.g., showCreateForm)
            }}
          />
        </TabPanel>

        <TabPanel value={tab} index={7}>
          <CalendarTab selectedStudent={selectedStudent} />
        </TabPanel>
      </div>
    </div>
  );
}
