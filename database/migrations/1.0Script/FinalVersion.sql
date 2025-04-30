
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    face_id_hash TEXT,
    face_id_vector TEXT,
    face_id_encrypted BOOLEAN,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Table: classes
CREATE TABLE classes (
    class_id INT PRIMARY KEY AUTO_INCREMENT,
    class_name VARCHAR(100) NOT NULL,
    class_code VARCHAR(10) NOT NULL UNIQUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- Table: class_users
CREATE TABLE class_users (
    class_id INT,
    user_id INT,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (class_id, user_id),
    FOREIGN KEY (class_id) REFERENCES classes(class_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Table: sessions
CREATE TABLE sessions (
    session_id INT PRIMARY KEY AUTO_INCREMENT,
    class_id INT,
    session_topic VARCHAR(255),
    session_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    created_by INT,
     qr_code TEXT,
     qr_last_updated_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(class_id),
    FOREIGN KEY (created_by) REFERENCES users(user_id)
);

-- Table: attendance
CREATE TABLE attendance (
    session_id INT,
    user_id INT,
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('present', 'absent') NOT NULL,
    PRIMARY KEY (session_id, user_id),
    FOREIGN KEY (session_id) REFERENCES sessions(session_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Table: logs
CREATE TABLE logs (
    log_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action_type VARCHAR(50) NOT NULL,
    description TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

