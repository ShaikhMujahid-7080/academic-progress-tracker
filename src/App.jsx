import { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";

// import { AuthScreen } from "./components/UI/AuthScreen";
import { StudentSelectionScreen } from "./components/UI/StudentSelectionScreen";
import { Header } from "./components/UI/Header";
import { TabNavigation } from "./components/UI/TabNavigation";
import { TabPanel } from "./components/UI/TabPanel";
import { TheoryTab } from "./components/Tabs/TheoryTab";
import { PracticalTab } from "./components/Tabs/PracticalTab";
import { StudentManagementTab } from "./components/Tabs/StudentManagementTab";

import { useFirestore } from "./components/hooks/useFirestore";
import { useStudentManagement } from "./components/hooks/useStudentManagement";
import { useLocalStorage } from "./components/hooks/useLocalStorage";

export default function App() {
  const [semester, setSemester] = useState(5);

  // Student management hook
  const studentManagement = useStudentManagement();
  const {
    students,
    selectedStudent,
    isLoading: studentsLoading,
    hasInitialized,
    selectStudent,
  } = studentManagement;

  // Current student's specific storage key
  const studentStorageKey = selectedStudent
    ? `academic-data-${selectedStudent.rollNo}`
    : "academic-temp";

  // Local state for student's academic data
  const [allData, setAllData] = useLocalStorage(studentStorageKey, {});

  // Firestore sync with student ID
  const studentId = selectedStudent?.rollNo;
  const { isOnline, isSyncing, lastSynced, saveToFirestore, loadAllData } =
    useFirestore(studentId);

  const navigate = useNavigate();

  // Load student data on selection or connectivity change
  useEffect(() => {
    if (!selectedStudent) {
      // Clear local data and navigate selection
      setAllData({});
      navigate("/select-student", { replace: true });
      return;
    }

    async function loadStudentData() {
      // Clear current data first for clean slate
      setAllData({});

      if (!selectedStudent) return;

      if (isOnline) {
        try {
          const firestoreData = await loadAllData();
          if (firestoreData && Object.keys(firestoreData).length > 0) {
            setAllData(firestoreData);
          } else {
            setAllData({});
          }
        } catch (e) {
          setAllData({});
          console.error("Error loading student data:", e);
        }
      }
    }

    loadStudentData();
  }, [selectedStudent, isOnline]);

  // Change handler to update local & remote data
  async function handleDataChange(subject, data, type = "theory") {
    if (!selectedStudent) return;

    const key = `${semester}-${subject}`;
    const updatedEntry = { data, type, semester, subject };
    const newData = { ...allData, [key]: updatedEntry };
    setAllData(newData);

    if (isOnline) {
      try {
        await saveToFirestore(semester, subject, data, type);
      } catch (e) {
        console.warn("Firestore sync failed, stored locally:", e);
      }
    }
  }

  // When user selects a student from selection page
  function handleStudentSelection(student) {
    setAllData({});
    selectStudent(student);
    navigate("/", { replace: true });
  }

  // Handler to log out current student selection
  function handleStudentSwitch() {
    selectStudent(null);
    localStorage.removeItem("selected-student");
    navigate("/select-student", { replace: true });
  }

  return (
    <>
      <Routes>
        {/* <Route
          path="/auth"
          element={
            <AuthScreen // Optional, based on your auth implementation
            />
          }
        /> */}

        <Route
          path="/select-student"
          element={
            <StudentSelectionScreen
              students={students}
              onStudentSelect={handleStudentSelection}
              isLoading={studentsLoading}
            />
          }
        />

        <Route
          path="/*"
          element={
            selectedStudent ? (
              <>
                <Header
                  semester={semester}
                  syncStatus={{ isOnline, isSyncing, lastSynced }}
                  selectedStudent={selectedStudent}
                  onStudentSwitch={handleStudentSwitch}
                />
                <TabNavigation
                  activeTab={semester} // You can switch to URL-based routing later
                  onTabChange={() => {}}
                />
                <main className="max-w-7xl mx-auto p-6">
                  <Routes>
                    <Route
                      path="/"
                      element={<Navigate to="/theory" replace />}
                    />
                    <Route
                      path="/theory"
                      element={
                        <TheoryTab
                          semester={semester}
                          allData={allData}
                          handleDataChange={handleDataChange}
                        />
                      }
                    />
                    <Route
                      path="/practical"
                      element={
                        <PracticalTab
                          semester={semester}
                          allData={allData}
                          handleDataChange={handleDataChange}
                        />
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <StudentManagementTab
                          semester={semester}
                          setSemester={setSemester}
                          studentManagement={studentManagement}
                        />
                      }
                    />
                    <Route
                      path="*"
                      element={<Navigate to="/theory" replace />}
                    />
                  </Routes>
                </main>
              </>
            ) : (
              <Navigate to="/select-student" replace />
            )
          }
        />
      </Routes>
    </>
  );
}
