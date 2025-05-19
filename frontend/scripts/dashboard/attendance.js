import { utils } from './utils.js';
import { CONFIG } from './config.js';

// Attendance management
export const attendance = {
  // Attendance elements
  elements: {
    attendanceList: null,
    attendanceStats: null,
    attendanceChart: null
  },

  // Initialize attendance
  init() {
    this.elements.attendanceList = document.getElementById('attendanceList');
    this.elements.attendanceStats = document.getElementById('attendanceStats');
    this.elements.attendanceChart = document.getElementById('attendanceChart');
    
    this.loadAttendanceData();
  },

  // Load attendance data
  async loadAttendanceData() {
    try {
      // In a real application, this would be an API call
      const response = await fetch(CONFIG.API_ENDPOINTS.ATTENDANCE);
      const data = await response.json();
      
      this.renderAttendanceList(data.records);
      this.updateAttendanceStats(data.stats);
      this.renderAttendanceChart(data.chartData);
    } catch (error) {
      console.error('Error loading attendance data:', error);
      utils.showNotification('Failed to load attendance data', 'error');
      
      // Fallback to mock data for development
      this.renderAttendanceList(CONFIG.MOCK_DATA.attendance.records);
      this.updateAttendanceStats(CONFIG.MOCK_DATA.attendance.stats);
      this.renderAttendanceChart(CONFIG.MOCK_DATA.attendance.chartData);
    }
  },

  // Render attendance list
  renderAttendanceList(records) {
    if (!this.elements.attendanceList) return;
    
    this.elements.attendanceList.innerHTML = records.map(record => `
      <div class="attendance-record">
        <div class="attendance-info">
          <h3>${record.className}</h3>
          <p class="attendance-date">${utils.formatDate(record.date)}</p>
        </div>
        <div class="attendance-status">
          <span class="status-badge ${record.status.toLowerCase()}">${record.status}</span>
        </div>
      </div>
    `).join('');
  },

  // Update attendance statistics
  updateAttendanceStats(stats) {
    if (!this.elements.attendanceStats) return;
    
    this.elements.attendanceStats.innerHTML = `
      <div class="stat-card">
        <h3>Overall Attendance</h3>
        <div class="stat-value ${utils.getAttendanceClass(stats.overall)}">
          ${stats.overall}%
        </div>
      </div>
      <div class="stat-card">
        <h3>Present</h3>
        <div class="stat-value">${stats.present}</div>
      </div>
      <div class="stat-card">
        <h3>Absent</h3>
        <div class="stat-value">${stats.absent}</div>
      </div>
      <div class="stat-card">
        <h3>Late</h3>
        <div class="stat-value">${stats.late}</div>
      </div>
    `;
  },

  // Render attendance chart
  renderAttendanceChart(chartData) {
    if (!this.elements.attendanceChart) return;
    
    // In a real application, this would use a charting library
    // For now, we'll create a simple visualization
    const chartContainer = document.createElement('div');
    chartContainer.className = 'attendance-chart';
    
    chartData.forEach(data => {
      const bar = document.createElement('div');
      bar.className = 'chart-bar';
      bar.style.height = `${data.value}%`;
      bar.title = `${data.label}: ${data.value}%`;
      
      chartContainer.appendChild(bar);
    });
    
    this.elements.attendanceChart.innerHTML = '';
    this.elements.attendanceChart.appendChild(chartContainer);
  },

  // Mark attendance
  async markAttendance(classId, status) {
    try {
      const response = await fetch(CONFIG.API_ENDPOINTS.MARK_ATTENDANCE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          classId,
          status,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark attendance');
      }
      
      utils.showNotification('Attendance marked successfully', 'success');
      this.loadAttendanceData(); // Refresh attendance data
    } catch (error) {
      console.error('Error marking attendance:', error);
      utils.showNotification('Failed to mark attendance', 'error');
    }
  }
}; 