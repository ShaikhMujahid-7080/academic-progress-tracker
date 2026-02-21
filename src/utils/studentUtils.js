/**
 * Computes the default semester for a student based on their admission year and the current date.
 * Uses academic-year boundaries: each academic year (e.g., 2024-25) has two semesters.
 * Academic year is considered to start in July.
 */
export const computeDefaultSemester = (student) => {
    if (!student || !student.admissionYear) return null;
    const now = new Date();
    const month = now.getMonth() + 1; // 1-12

    // Determine the start year of the current academic year
    const currentAcademicYearStart = month >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    const admissionAcademicYearStart = Number(student.admissionYear);

    // Number of full academic years passed since admission
    let yearsPassed = currentAcademicYearStart - admissionAcademicYearStart;

    // Adjust for Year Drop (YD)
    if (student.isYD) {
        yearsPassed -= 1;
    }

    if (yearsPassed < 0) yearsPassed = 0;

    const startSem = student.isDSY ? 3 : 1;
    // semesterIndex: 0 for first semester of academic year (July-Dec), 1 for second (Jan-Jun)
    const semesterIndex = month >= 7 ? 0 : 1;

    let sem = startSem + yearsPassed * 2 + semesterIndex;
    if (sem < startSem) sem = startSem;
    if (sem > 8) sem = 8;
    return sem;
};

/**
 * Returns the academic year label for a student (1st, 2nd, 3rd, 4th, or Passout).
 */
export const getStudentYear = (student) => {
    if (!student || !student.admissionYear) return null;
    const sem = computeDefaultSemester(student);
    const now = new Date();
    const month = now.getMonth() + 1;
    const currentAcademicYearStart = month >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    let yearsPassed = currentAcademicYearStart - Number(student.admissionYear);
    if (student.isYD) {
        yearsPassed -= 1;
    }
    if (yearsPassed < 0) yearsPassed = 0;

    // If semester > 8 or years passed >= 4 (for non-DSY) or >= 3 (for DSY)
    // Actually, computeDefaultSemester caps sem at 8. 
    // Let's check yearsPassed instead for Passout.
    // Also add +1 to maxYears if they had a Year Drop to delay passout label.
    const baseMaxYears = student.isDSY ? 3 : 4;

    if (yearsPassed >= baseMaxYears) {
        if (month >= 7 || yearsPassed > baseMaxYears) return "Passout";
    }

    if (sem <= 2) return "1st Year";
    if (sem <= 4) return "2nd Year";
    if (sem <= 6) return "3rd Year";
    if (sem <= 8) return "4th Year";
    return "Passout";
};

/**
 * Returns true if student has completed 4 or more academic years since admission.
 */
export const hasCompletedFourYears = (student) => {
    if (!student || !student.admissionYear) return false;
    const now = new Date();
    const month = now.getMonth() + 1;
    const currentAcademicYearStart = month >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    let yearsPassed = currentAcademicYearStart - Number(student.admissionYear);
    if (student.isYD) yearsPassed -= 1;
    return yearsPassed >= 4;
};

/**
 * Returns true if student data should be automatically deleted (1 year after graduation).
 */
export const shouldDeleteStudent = (student) => {
    if (!student || !student.admissionYear) return false;
    const now = new Date();
    const month = now.getMonth() + 1;
    const currentAcademicYearStart = month >= 7 ? now.getFullYear() : now.getFullYear() - 1;
    let yearsPassed = currentAcademicYearStart - Number(student.admissionYear);
    if (student.isYD) yearsPassed -= 1;

    // Graduation happens after maxYears (4 for normal, 3 for DSY)
    const baseMaxYears = student.isDSY ? 3 : 4;

    // Delete 1 year after graduation
    // If they graduate in 2024 (yearsPassed 4/3), they should be deleted in 2025 (yearsPassed 5/4)
    const deletionYears = baseMaxYears + 1;

    return yearsPassed >= deletionYears;
};
