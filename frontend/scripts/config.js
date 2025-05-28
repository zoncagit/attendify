const CONFIG = {
    API_URL: 'http://127.0.0.1:8000/docs', //Change this to your actual backend URL
    API_ENDPOINTS: {
      LOGIN: '/api/v1/auth/login',
      SIGNUP: '/api/v1/auth/signup',
      FORGOT_PASSWORD: '/api/v1/auth/request-password-reset',
      RESET_PASSWORD: '/api/v1/auth/reset-password',
      VERIFY_EMAIL: '/api/v1/auth/verify',
      CLASSES: '/classes',
      ATTENDANCE: '/attendance',
      MARK_ATTENDANCE: '/attendance/mark',
      STUDENTS: '/students',
      PROFILE: '/profile',
      RESEND_CODE: '/api/auth/resend-verification'
    },
    TOKEN_KEY: 'attendify_token',
    USER_KEY: 'attendify_user'
  };
  
  //Prevent modification of the config object
  Object.freeze(CONFIG);
  
  export default CONFIG; 