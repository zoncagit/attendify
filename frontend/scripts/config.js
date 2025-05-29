const CONFIG = {
  API_URL: 'http://127.0.0.1:8000',
  API_ENDPOINTS: {
    // Auth endpoints
    LOGIN: '/api/v1/auth/login',
    SIGNUP: '/api/v1/auth/signup',
    FORGOT_PASSWORD: '/api/v1/auth/request-password-reset',
    RESET_PASSWORD: '/api/v1/auth/reset-password',
    VERIFY_EMAIL: '/api/v1/auth/verify',
    RESEND_CODE: '/api/v1/auth/resend-verification',
    
    // User endpoints
    USER_PROFILE: '/api/v1/users/profile',
    UPDATE_PROFILE: '/api/v1/users/profile/update',
    UPLOAD_FACE: '/api/v1/users/face-recognition/upload',
    VERIFY_FACE: '/api/v1/users/face-recognition/verify',
    
    // Class endpoints
    ENROLLED_CLASSES: '/api/v1/classes/enrolled',
    TUTORED_CLASSES: '/api/v1/classes/tutored',
    CREATE_CLASS: '/api/v1/classes',
    DELETE_CLASS: '/api/v1/classes',
    UPDATE_CLASS: '/api/v1/classes/update',
    
    // Group endpoints
    ADD_GROUP: '/api/v1/classes/groups/add',
    DELETE_GROUP: '/api/v1/classes/groups/delete',
    UPDATE_GROUP: '/api/v1/classes/groups/update',
    
    // Enrollment endpoints
    ENROLL_CLASS: '/api/v1/classes/enroll',
    QUIT_CLASS: '/api/v1/classes/quit',
    
    // Attendance endpoints
    MARK_ATTENDANCE: '/api/v1/attendance/mark',
    GET_ATTENDANCE: '/api/v1/attendance/get',
    GET_CLASS_ATTENDANCE: '/api/v1/attendance/class'
  },
  TOKEN_KEY: 'attendify_token',
  USER_KEY: 'attendify_user'
};

//Prevent modification of the config object
Object.freeze(CONFIG);

export default CONFIG; 