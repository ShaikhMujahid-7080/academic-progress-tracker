import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { subjects as defaultSubjects } from "../../data/subjects"; // Keep as initial seed

// Fallback configuration if a subject doesn't have an explicit config
export const DEFAULT_THEORY_CA_COUNT = 4;
export const DEFAULT_PRACTICAL_LAB_COUNT = 10;

/**
 * Hook to manage dynamic subjects across the app.
 * Reads/writes from `appConfig/subjects` document in Firestore.
 */
export function useSubjects(isAdmin, isCoLeader) {
    const [subjectsData, setSubjectsData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const docRef = doc(db, "appConfig", "subjects");

        const unsubscribe = onSnapshot(docRef, async (snapshot) => {
            if (snapshot.exists()) {
                setSubjectsData(snapshot.data());
                setIsLoading(false);
            } else {
                // First run: Seed the database with the hardcoded subjects.js structure
                // Convert array structures to object structures to include config
                const seededData = {};
                for (const [semester, data] of Object.entries(defaultSubjects)) {
                    seededData[semester] = {
                        theory: data.theory.map(name => ({
                            name,
                            caCount: DEFAULT_THEORY_CA_COUNT
                        })),
                        practical: data.practical.map(name => ({
                            name,
                            labCount: DEFAULT_PRACTICAL_LAB_COUNT
                        }))
                    };
                }

                try {
                    // If we have an admin/coleader, they can seed it. Otherwise, we just use local state for now
                    // until an admin logs in and the snapshot creates it.
                    if (isAdmin || isCoLeader) {
                        await setDoc(docRef, seededData);
                    }
                    setSubjectsData(seededData);
                } catch (error) {
                    console.error("Error seeding subjects config:", error);
                    setSubjectsData(seededData); // Fallback to memory on failure
                } finally {
                    setIsLoading(false);
                }
            }
        }, (error) => {
            console.error("Error listening to subjects config:", error);
            setIsLoading(false);

            // Fallback
            if (!subjectsData) {
                const fallbackData = {};
                for (const [semester, data] of Object.entries(defaultSubjects)) {
                    fallbackData[semester] = {
                        theory: data.theory.map(name => ({ name, caCount: DEFAULT_THEORY_CA_COUNT })),
                        practical: data.practical.map(name => ({ name, labCount: DEFAULT_PRACTICAL_LAB_COUNT }))
                    };
                }
                setSubjectsData(fallbackData);
            }
        });

        return () => unsubscribe();
    }, [isAdmin, isCoLeader]);

    const saveSubjects = async (newData) => {
        if (!isAdmin && !isCoLeader) throw new Error("Permission denied");
        setIsSaving(true);
        try {
            const docRef = doc(db, "appConfig", "subjects");
            await setDoc(docRef, newData);
            return true;
        } catch (error) {
            console.error("Error saving subjects:", error);
            throw error;
        } finally {
            setIsSaving(false);
        }
    };

    /**
     * Helper to ensure the structure exists before mutating
     */
    const ensureSemesterStructure = (currentData, semester) => {
        const data = { ...currentData };
        if (!data[semester]) {
            data[semester] = { theory: [], practical: [] };
        }
        return data;
    };

    const addSubject = async (semester, type, name, config = {}) => {
        if (!subjectsData) return false;
        const newData = ensureSemesterStructure(subjectsData, semester);

        const newSubject = {
            name,
            ...config
        };

        if (type === 'theory' && !newSubject.caCount) newSubject.caCount = DEFAULT_THEORY_CA_COUNT;
        if (type === 'practical' && !newSubject.labCount) newSubject.labCount = DEFAULT_PRACTICAL_LAB_COUNT;

        newData[semester][type] = [...newData[semester][type], newSubject];
        return await saveSubjects(newData);
    };

    const updateSubject = async (semester, type, index, updatedSubject) => {
        if (!subjectsData) return false;
        const newData = ensureSemesterStructure(subjectsData, semester);

        const newArray = [...newData[semester][type]];
        newArray[index] = { ...newArray[index], ...updatedSubject };
        newData[semester][type] = newArray;

        return await saveSubjects(newData);
    };

    const removeSubject = async (semester, type, index) => {
        if (!subjectsData) return false;
        const newData = ensureSemesterStructure(subjectsData, semester);

        const newArray = [...newData[semester][type]];
        newArray.splice(index, 1);
        newData[semester][type] = newArray;

        return await saveSubjects(newData);
    };

    const reorderSubjects = async (semester, type, startIndex, endIndex) => {
        if (!subjectsData) return false;
        const newData = ensureSemesterStructure(subjectsData, semester);

        const newArray = Array.from(newData[semester][type]);
        const [removed] = newArray.splice(startIndex, 1);
        newArray.splice(endIndex, 0, removed);
        newData[semester][type] = newArray;

        return await saveSubjects(newData);
    };

    return {
        subjectsConfig: subjectsData,
        isLoading,
        isSaving,
        addSubject,
        updateSubject,
        removeSubject,
        reorderSubjects,
        saveSubjects
    };
}
