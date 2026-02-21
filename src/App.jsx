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
import { computeDefaultSemester, hasCompletedFourYears } from "./utils/studentUtils";
import { Footer } from "./components/UI/Footer";
import { useSubjects } from "./components/hooks/useSubjects";

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

  // Subjects configuration
  const isCoLeader = selectedStudent?.role === 'co-leader' && selectedStudent?.rollNo !== ADMIN_STUDENT.rollNo;
  const { subjectsConfig, isLoading: subjectsLoading } = useSubjects(studentManagement.isAdmin, isCoLeader);

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
  }, [selectedStudent]); // Note: intentionally exclude isOnline — re-running on network
  // toggle would wipe and reload data mid-edit, overwriting unsaved marks.



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

    // Use functional updater to always merge into the LATEST state.
    // Spreading from the captured `allData` closure would silently
    // discard concurrent saves from other subjects (stale-closure bug).
    setAllData(prev => ({
      ...prev,
      [key]: updatedItem
    }));

    if (isOnline) {
      try {
        await saveToFirestore(semester, subject, data, type);
      } catch (error) {
        console.error('Error syncing to Firestore:', error);
      }
    }
  };



  // On student selection from selection screen, clear data immediately and set student
  const handleStudentSelection = (student) => {
    setAllData({});
    const defaultSem = computeDefaultSemester(student);
    if (defaultSem) setSemester(defaultSem);
    selectStudent(student);
  };

  // Theme for Student Selection Screen (Light by default)
  const [loginTheme, setLoginTheme] = useState(() => {
    return localStorage.getItem('loginTheme') || 'light';
  });

  const toggleLoginTheme = () => {
    const newTheme = loginTheme === 'dark' ? 'light' : 'dark';
    setLoginTheme(newTheme);
    localStorage.setItem('loginTheme', newTheme);
  };

  // Show loading or student selection screen if no student selected OR resettingData is in progress
  if (!selectedStudent || studentsLoading || !hasInitialized || resettingData || subjectsLoading) {
    return (
      <div className={`
        min-h-screen transition-colors duration-700 relative overflow-hidden flex flex-col
        ${loginTheme === 'dark'
          ? 'bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81]'
          : 'bg-gradient-to-br from-blue-50 via-indigo-100 to-purple-100'
        } animate-gradient
      `}>
        {/* Animated Background Orbs */}
        <div className={`
          absolute top-[-10%] right-[-10%] w-[70%] h-[70%] rounded-full blur-[120px] animate-pulse transition-colors duration-700
          ${loginTheme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-400/20'}
        `} />
        <div className={`
          absolute bottom-[-10%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[120px] animate-pulse delay-700 transition-colors duration-700
          ${loginTheme === 'dark' ? 'bg-indigo-500/10' : 'bg-indigo-400/20'}
        `} />

        <div className="flex-1 flex items-center justify-center relative z-10 px-4 py-8 md:py-12">
          <StudentSelectionScreen
            students={students}
            onStudentSelect={handleStudentSelection}
            isLoading={studentsLoading || !hasInitialized}
            studentManagement={studentManagement}
            theme={loginTheme}
            onThemeToggle={toggleLoginTheme}
          />
        </div>
        <Footer />
      </div>
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
        onNavigate={setTab}
      />
      <TabNavigation
        activeTab={tab}
        onTabChange={setTab}
        showDegreeTab={hasCompletedFourYears(selectedStudent)}
        showAdminTab={selectedStudent?.rollNo === ADMIN_STUDENT.rollNo || selectedStudent?.role === 'co-leader'}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <TabPanel value={tab} index={0}>
          {subjectsConfig && <TheoryTab
            semester={semester}
            allData={allData}
            handleDataChange={handleDataChange}
            selectedStudent={selectedStudent}
            subjectsConfig={subjectsConfig}
          />}
        </TabPanel>

        <TabPanel value={tab} index={1}>
          {subjectsConfig && <PracticalTab
            semester={semester}
            allData={allData}
            handleDataChange={handleDataChange}
            selectedStudent={selectedStudent}
            subjectsConfig={subjectsConfig}
          />}
        </TabPanel>

        <TabPanel value={tab} index={2}>
          <NoticeBoardTab
            selectedStudent={selectedStudent}
            semester={semester}
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
            subjectsConfig={subjectsConfig}
          />
        </TabPanel>

        <TabPanel value={tab} index={7}>
          <CalendarTab
            selectedStudent={selectedStudent}
            semester={semester}
          />
        </TabPanel>
      </div>

      <Footer />
    </div>
  );
}
