const CONFIG = {
  API_URL: 'http://localhost:3000/api', //Change this to your actual backend URL
  API_ENDPOINTS: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    CLASSES: '/classes',
    ATTENDANCE: '/attendance',
    MARK_ATTENDANCE: '/attendance/mark',
    STUDENTS: '/students',
    PROFILE: '/profile'
  },
  TOKEN_KEY: 'attendify_token',
  USER_KEY: 'attendify_user'
};

// Prevent modification of the config object
Object.freeze(CONFIG);

export default CONFIG; 