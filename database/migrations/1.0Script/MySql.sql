CREATE DATABASE attendance_systema;
USE attendance_systema;
CREATE TABLE users (
  user_id INT PRIMARY KEY AUTO_INCREMENT,
  full_name VARCHAR(100),
  email VARCHAR(100),
  password_hash VARCHAR(255),
  face_id_hash TEXT,
  qr_code TEXT,
  face_id_vector TEXT,
  face_confidence FLOAT,
  qr_last_updated_at TIMESTAMP,
  face_id_encrypted BOOLEAN,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Create the 'classes' table
CREATE TABLE classes (
  class_id INT PRIMARY KEY AUTO_INCREMENT,
  class_name VARCHAR(100),
  class_code VARCHAR(10),
  created_by INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- Create the 'class_users' table
CREATE TABLE class_users (
  class_id INT,
  user_id INT,
  role ENUM('admin', 'student'),
  joined_at TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(class_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  PRIMARY KEY (class_id, user_id) -- Composite primary key
);

-- Create the 'sessions' table
CREATE TABLE sessions (
  session_id INT PRIMARY KEY AUTO_INCREMENT,
  class_id INT,
  session_topic VARCHAR(255),
  session_date DATETIME,
  created_by INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(class_id),
  FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- Create the 'attendance' table
CREATE TABLE attendance (
  session_id INT,
  user_id INT,
  status ENUM('present', 'absent', 'late'),
  method ENUM('face', 'qr', 'manual'),
  marked_at TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(session_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  PRIMARY KEY (session_id, user_id) -- Composite primary key
);

-- Create the 'feedback' table
CREATE TABLE feedback (
  feedback_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  class_id INT,
  message TEXT,
  rating INT,
  submitted_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (class_id) REFERENCES classes(class_id)
);

-- Create the 'logs' table
CREATE TABLE logs (
  log_id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT,
  action_type VARCHAR(50),
  description TEXT,
  timestamp TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);
-- (Your existing CREATE TABLE statements)

-- Insert sample data (add these after the CREATE TABLE statements)
