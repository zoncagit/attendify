export default {
    API_URL: 'http://127.0.0.1:8000/api/v1',
    ENDPOINTS: {
        // Auth endpoints
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        PROFILE: '/users/profile',
        
        // Class endpoints
        CLASSES: '/classes',
        CREATE_CLASS: '/classes/create',
        JOIN_CLASS: '/classes/join',
        
        // Student endpoints
        STUDENTS: '/students',
        ADD_STUDENT: '/students/add',
        REMOVE_STUDENT: '/students/remove',
        IMPORT_STUDENTS: '/students/import',
        EXPORT_STUDENTS: '/students/export',
        
        // Group endpoints
        GROUPS: '/groups',
        CREATE_GROUP: '/groups/create',
        DELETE_GROUP: '/groups/delete',
        ADD_TO_GROUP: '/groups/add-student',
        REMOVE_FROM_GROUP: '/groups/remove-student',
        
        // Attendance endpoints
        ATTENDANCE: '/attendance',
        MARK_ATTENDANCE: '/attendance/mark',
        GET_ATTENDANCE: '/attendance/get',
        ATTENDANCE_STATS: '/attendance/stats'
    }
}; 