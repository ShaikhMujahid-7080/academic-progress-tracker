import { useState, useEffect } from "react";
import { StudentSelectionScreen } from "./components/UI/StudentSelectionScreen";
import { Header } from "./components/UI/Header";
import { TabNavigation } from "./components/UI/TabNavigation";
import { TabPanel } from "./components/UI/TabPanel";
import { TheoryTab } from "./components/Tabs/TheoryTab";
import { PracticalTab } from "./components/Tabs/PracticalTab";
import { StudentManagementTab } from "./components/Tabs/StudentManagementTab";
import { useLocalStorage } from "./components/hooks/useLocalStorage";
import { useFirestore } from "./components/hooks/useFirestore";
import { useStudentManagement } from "./components/hooks/useStudentManagement";

export default function App() {
  const [tab, setTab] = useState(0);
  const [semester, setSemester] = useState(5);

  // Student management
  const studentManagement = useStudentManagement();
  const {
    students,
    selectedStudent,
    isLoading: studentsLoading,
    hasInitialized,
    selectStudent
  } = studentManagement;

  // Local storage for offline support (now student-specific)
  const studentKey = selectedStudent ? `academic-data-${selectedStudent.rollNo}` : 'academic-data-temp';
  const [allData, setAllData] = useLocalStorage(studentKey, {});

  // Firebase integration (now student-based)
  const studentId = selectedStudent?.rollNo;
  const { isOnline, isSyncing, lastSynced, saveToFirestore, loadAllData } = useFirestore(studentId);

  // Load data when student changes
  useEffect(() => {
    if (!selectedStudent) {
      setAllData({});
      return;
    }

    const loadStudentData = async () => {
      try {
        // Clear local data first to ensure clean start
        setAllData({});

        if (isOnline) {
          console.log(`Loading data for student: ${selectedStudent.name} (${selectedStudent.rollNo})`);
          const firestoreData = await loadAllData();

          if (Object.keys(firestoreData).length > 0) {
            setAllData(firestoreData);
            console.log('✅ Student data loaded from Firestore');
          } else {
            console.log('No data found in Firestore for this student - starting with clean slate');
            setAllData({});
          }
        }
      } catch (error) {
        console.error('Error loading student data:', error);
        setAllData({});
      }
    };

    loadStudentData();
  }, [selectedStudent, isOnline]);

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
        const success = await saveToFirestore(semester, subject, data, type);
        if (!success) {
          console.warn('Failed to sync to Firestore, data saved locally');
        }
      } catch (error) {
        console.error('Error syncing to Firestore:', error);
      }
    }
  };

  // Handle student selection from selection screen
  const handleStudentSelection = (student) => {
    setAllData({});
    selectStudent(student);
  };

  // Show loading or student selection screen if no student selected
  if (!selectedStudent || studentsLoading || !hasInitialized) {
    return (
      <StudentSelectionScreen
        students={students}
        onStudentSelect={handleStudentSelection}
        isLoading={studentsLoading || !hasInitialized}
      />
    );
  }

  const syncStatus = { isOnline, isSyncing, lastSynced };

  // Handle student switching
  const handleStudentSwitch = () => {
    selectStudent(null);
    localStorage.removeItem('selected-student');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <Header
        semester={semester}
        syncStatus={syncStatus}
        selectedStudent={selectedStudent}
        onStudentSwitch={handleStudentSwitch}
      />
      <TabNavigation activeTab={tab} onTabChange={setTab} />

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
          <StudentManagementTab
            semester={semester}
            setSemester={setSemester}
            studentManagement={studentManagement}
          />
        </TabPanel>
      </div>
    </div>
  );
}

