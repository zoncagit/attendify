// Configuration and constants
export const CONFIG = {
  // API endpoints
  API: {
    BASE_URL: '/api',
    ENDPOINTS: {
      CLASSES: '/classes',
      STUDENTS: '/students',
      ATTENDANCE: '/attendance'
    }
  },
  
  // UI constants
  UI: {
    MODAL_ANIMATION_DURATION: 300,
    NOTIFICATION_DURATION: 3000,
    QR_CODE_DURATION: 120, // seconds
    SCAN_PROGRESS_INTERVAL: 200 // milliseconds
  },
  
  // Validation patterns
  VALIDATION: {
    STUDENT_ID: /^STU-[A-Z]{3}-\d{4}$/,
    CLASS_CODE: /^[A-Z]{3}\d{2}$/
  }
};

// Mock data for development
export const MOCK_DATA = {
  user: {
    name: "Sididris Meriem",
    isNew: true
  },
  
  enrolledClasses: [
    {
      id: 1,
      title: "ANALYSE 1",
      code: "MTH101",
      professor: "Prof. MASSIED",
      attendanceRate: 85,
      classesAttended: 17,
      totalClasses: 20
    },
    {
      id: 2,
      title: "ALGO 1",
      code: "CS120",
      professor: "Prof. HADJYAHIA",
      attendanceRate: 90,
      classesAttended: 18,
      totalClasses: 20
    }
  ],
  
  tutoredClasses: [
    {
      id: 101,
      title: "ARCHI 1",
      code: "ARC32B",
      groups: [
        { id: 1, name: "Group A", students: 15, attendance: 80 },
        { id: 2, name: "Group B", students: 12, attendance: 75 },
        { id: 3, name: "Group C", students: 8, attendance: 92 }
      ],
      students: [
        { id: 52148769, name: "Smaili Soumia", group: "Group A", attendance: 95, status: "present" },
        { id: 63584921, name: "Adour Serine", group: "Group A", attendance: 85, status: "absent" },
        { id: 78123456, name: "Bersali Sirine", group: "Group B", attendance: 90, status: "present" },
        { id: 91023847, name: "Mellak Nour", group: "Group B", attendance: 88, status: "present" },
        { id: 45678123, name: "Bencherchali Iyad", group: "Group C", attendance: 92, status: "present" },
        { id: 87654321, name: "Daif Iyad", group: "Group C", attendance: 78, status: "absent" }
      ]
    }
  ]
}; 