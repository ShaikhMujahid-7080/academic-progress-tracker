export const subjects = {
  1: {
    theory: ["Mathematics-I", "Physics", "Programming Fundamentals", "English"],
    practical: ["Physics Lab", "Programming Lab"]
  },
  2: {
    theory: ["Mathematics-II", "Chemistry", "Data Structures", "Digital Logic"],
    practical: ["Chemistry Lab", "DS Lab"]
  },
  3: {
    theory: ["OOP", "Discrete Math", "Computer Architecture", "Statistics"],
    practical: ["OOP Lab", "Hardware Lab"]
  },
  4: {
    theory: ["DBMS", "Operating Systems", "Computer Networks", "Software Engineering"],
    practical: ["DBMS Lab", "Networks Lab"]
  },
  5: {
    theory: ["AIA", "DAA", "DBMS", "ES", "MLA", "MDM", "OE-4"],
    practical: ["DAA Lab", "DBMS Lab", "MLA Lab", "ES Lab"]
  },
  6: {
    theory: ["CNN", "CVPR", "DV", "K.ENG", "MDM", "SR"],
    practical: ["CNN Lab", "DV Lab", "K.ENG Lab", "MAD Lab", "SR Lab"]
  },
  7: {
    theory: ["Deep Learning", "Big Data Analytics", "Cybersecurity", "Project Management"],
    practical: ["ML Lab", "Security Lab"]
  },
  8: {
    theory: ["Major Project", "Technical Seminar", "Industry Training"],
    practical: ["Project Implementation"]
  },
};

export const caOptions = [
  "Assignment",
  "Test",
  "Presentation",
  "Quiz",
  "Certificate",
  "Project",
  "Other"
];

// Admin configuration
export const ADMIN_STUDENT = {
  rollNo: "2405225",
  name: "Shaikh Mujahid",
  // Defaults used when admin is bootstrapped
  admissionYear: 2024,
  isDSY: false
};