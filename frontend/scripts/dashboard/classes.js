import { utils } from './utils.js';
import { CONFIG } from './config.js';

// Class management
export const classes = {
  // Class elements
  elements: {
    enrolledClasses: null,
    tutoredClasses: null,
    classDetails: null
  },

  // Initialize classes
  init() {
    this.elements.enrolledClasses = document.getElementById('enrolledClasses');
    this.elements.tutoredClasses = document.getElementById('tutoredClasses');
    this.elements.classDetails = document.getElementById('classDetails');
    
    this.loadClasses();
  },

  // Load classes
  async loadClasses() {
    try {
      // In a real application, this would be an API call
      const response = await fetch(CONFIG.API_ENDPOINTS.CLASSES);
      const data = await response.json();
      
      this.renderEnrolledClasses(data.enrolled);
      this.renderTutoredClasses(data.tutored);
    } catch (error) {
      console.error('Error loading classes:', error);
      utils.showNotification('Failed to load classes', 'error');
      
      // Fallback to mock data for development
      this.renderEnrolledClasses(CONFIG.MOCK_DATA.enrolledClasses);
      this.renderTutoredClasses(CONFIG.MOCK_DATA.tutoredClasses);
    }
  },

  // Render enrolled classes
  renderEnrolledClasses(classes) {
    if (!this.elements.enrolledClasses) return;
    
    this.elements.enrolledClasses.innerHTML = classes.map(classItem => `
      <div class="class-card" data-class-id="${classItem.id}">
        <div class="class-header">
          <h3>${classItem.name}</h3>
          <span class="class-code">${classItem.code}</span>
        </div>
        <div class="class-info">
          <p><i class="fas fa-user"></i> ${classItem.instructor}</p>
          <p><i class="fas fa-clock"></i> ${classItem.schedule}</p>
          <p><i class="fas fa-map-marker-alt"></i> ${classItem.location}</p>
        </div>
        <div class="class-footer">
          <button class="btn btn-primary view-details" data-class-id="${classItem.id}">
            View Details
          </button>
        </div>
      </div>
    `).join('');
    
    // Add event listeners for view details buttons
    this.elements.enrolledClasses.querySelectorAll('.view-details').forEach(button => {
      button.addEventListener('click', (e) => {
        const classId = e.target.dataset.classId;
        this.showClassDetails(classId);
      });
    });
  },

  // Render tutored classes
  renderTutoredClasses(classes) {
    if (!this.elements.tutoredClasses) return;
    
    this.elements.tutoredClasses.innerHTML = classes.map(classItem => `
      <div class="class-card" data-class-id="${classItem.id}">
        <div class="class-header">
          <h3>${classItem.name}</h3>
          <span class="class-code">${classItem.code}</span>
        </div>
        <div class="class-info">
          <p><i class="fas fa-users"></i> ${classItem.studentCount} Students</p>
          <p><i class="fas fa-clock"></i> ${classItem.schedule}</p>
          <p><i class="fas fa-map-marker-alt"></i> ${classItem.location}</p>
        </div>
        <div class="class-footer">
          <button class="btn btn-primary view-details" data-class-id="${classItem.id}">
            View Details
          </button>
          <button class="btn btn-secondary mark-attendance" data-class-id="${classItem.id}">
            Mark Attendance
          </button>
        </div>
      </div>
    `).join('');
    
    // Add event listeners
    this.elements.tutoredClasses.querySelectorAll('.view-details').forEach(button => {
      button.addEventListener('click', (e) => {
        const classId = e.target.dataset.classId;
        this.showClassDetails(classId);
      });
    });
    
    this.elements.tutoredClasses.querySelectorAll('.mark-attendance').forEach(button => {
      button.addEventListener('click', (e) => {
        const classId = e.target.dataset.classId;
        this.showAttendanceModal(classId);
      });
    });
  },

  // Show class details
  async showClassDetails(classId) {
    try {
      // In a real application, this would be an API call
      const response = await fetch(`${CONFIG.API_ENDPOINTS.CLASS_DETAILS}/${classId}`);
      const data = await response.json();
      
      this.renderClassDetails(data);
    } catch (error) {
      console.error('Error loading class details:', error);
      utils.showNotification('Failed to load class details', 'error');
      
      // Fallback to mock data for development
      const mockClass = CONFIG.MOCK_DATA.enrolledClasses.find(c => c.id === classId) ||
                       CONFIG.MOCK_DATA.tutoredClasses.find(c => c.id === classId);
      this.renderClassDetails(mockClass);
    }
  },

  // Render class details
  renderClassDetails(classData) {
    if (!this.elements.classDetails) return;
    
    this.elements.classDetails.innerHTML = `
      <div class="class-details-header">
        <h2>${classData.name}</h2>
        <span class="class-code">${classData.code}</span>
      </div>
      
      <div class="class-details-info">
        <div class="info-group">
          <h3>Class Information</h3>
          <p><i class="fas fa-user"></i> Instructor: ${classData.instructor}</p>
          <p><i class="fas fa-clock"></i> Schedule: ${classData.schedule}</p>
          <p><i class="fas fa-map-marker-alt"></i> Location: ${classData.location}</p>
        </div>
        
        <div class="info-group">
          <h3>Attendance</h3>
          <div class="attendance-stats">
            <div class="stat">
              <span class="stat-label">Present</span>
              <span class="stat-value">${classData.attendance.present}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Absent</span>
              <span class="stat-value">${classData.attendance.absent}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Late</span>
              <span class="stat-value">${classData.attendance.late}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // Show attendance modal
  showAttendanceModal(classId) {
    // This would be implemented in the modals module
    // For now, we'll just show a notification
    utils.showNotification('Attendance marking feature coming soon', 'info');
  }
}; 