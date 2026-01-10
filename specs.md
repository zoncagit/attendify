Attendify – Technical Specification

1. Project Overview

Attendify is a web-based attendance management system designed for educational environments. It enables class creators (teachers or organizers) and students to manage attendance using QR code scanning or face recognition. The platform is inspired by tools like Google Classroom but focuses specifically on secure, verifiable attendance tracking.

The system is built as a web application with a FastAPI backend, a standard HTML/CSS/JavaScript frontend, AI-based face recognition using TensorFlow and OpenCV, and a relational database (MySQL or PostgreSQL).

⸻

2. Core Objectives
	•	Provide a fast and reliable way to mark attendance
	•	Prevent fake or proxy attendance
	•	Allow anyone to create or join classes (not limited to teachers)
	•	Support scalable class/group management
	•	Offer clear attendance analytics and exports

⸻

3. User Roles

3.1 Class Creator
	•	Can create classes and groups
	•	Generates QR codes for attendance sessions
	•	Can view full attendance logs and analytics
	•	Can remove users from a class or group
	•	Controls attendance settings

3.2 Student / Participant
	•	Can join classes using group codes
	•	Can mark attendance using QR code or face recognition
	•	Can view personal attendance statistics only
	•	Can leave and rejoin classes

Note: There is no strict role separation at signup. Any user can act as a class creator.

⸻

4. Authentication & User Management

4.1 Signup Requirements
	•	First name
	•	Last name
	•	Email (unique)
	•	Password (hashed)
	•	Profile photo (not used for face recognition)

4.2 Login
	•	Email + password
	•	Users can log in on multiple devices simultaneously
	•	Logging out clears all cached session data

4.3 Face Registration
	•	After signup, users must complete a face scanning phase
	•	Face data is converted into face embeddings
	•	Embeddings are stored securely in the database
	•	Users cannot delete face data or their account (for now)

⸻

5. Class & Group System

5.1 Classes
	•	Created by any user
	•	Properties:
	•	Class name
	•	Subject
	•	Creator ID
	•	Attendance settings

5.2 Groups
	•	Each class can contain multiple groups
	•	Users join a class by entering a group code
	•	Group codes are unique and human-readable

5.3 Membership Rules
	•	Users can belong to multiple classes and groups
	•	Users can leave a group and rejoin later
	•	Class creators can remove users (with confirmation)

⸻

6. Attendance Methods

6.1 QR Code Attendance
	•	Class creator generates a new QR code for each session
	•	QR code:
	•	Is time-limited (expires after a set duration)
	•	Is valid for one session only
	•	Students scan the QR code using their device
	•	On success, attendance is recorded with timestamp

6.2 Face Recognition Attendance
	•	Occurs on the class creator’s device
	•	Uses live camera input
	•	Steps:
	1.	Capture face image
	2.	Detect face using OpenCV
	3.	Generate embeddings using a custom TensorFlow model (.keras)
	4.	Compare embeddings with stored data
	•	Feedback messages:
	•	“Face recognized successfully”
	•	“Face not detected, try again”
	•	“Face does not match”

No pretrained face recognition models are used. The model is built from scratch for learning purposes.

⸻

7. Attendance Rules & Edge Cases
	•	QR code expiration → user is prompted to retry
	•	Face mismatch or detection failure → retry option
	•	Server timeout or network failure → retry button
	•	Offline devices → attendance is not recorded (no fallback yet)

⸻

8. Attendance Records & Analytics

8.1 For Class Creators
	•	View attendance logs per session
	•	View list of students and their attendance status for today
	•	View attendance percentage per student
	•	Export full attendance history as Excel file (dates per student)

8.2 For Students
	•	View personal attendance percentage
	•	Attendance percentage displayed in red if below a low threshold

⸻

9. Notifications
	•	Notifications are sent via email only
	•	Types:
	•	Reminder for upcoming classes
	•	Notification for missed classes
	•	Warning email if absences exceed 3

⸻

10. Permissions & Access Control
	•	Only class creators can:
	•	Edit class details
	•	Generate QR codes
	•	View full attendance logs
	•	Students can only view their own statistics

⸻

11. System Architecture

11.1 Backend
	•	Framework: FastAPI
	•	Structure: one file per concern
	•	auth.py
	•	routes.py
	•	models.py
	•	crud.py
	•	services.py
	•	AI: TensorFlow + OpenCV
	•	Database: MySQL or PostgreSQL

11.2 Frontend
	•	HTML, CSS, JavaScript
	•	Camera access for face scanning
	•	QR scanning via device camera

⸻

12. Security Considerations
	•	Passwords stored using hashing
	•	Face data stored as embeddings (not raw images)
	•	QR codes are time-limited and session-specific

⸻

13. Limitations (Current Scope)
	•	No data backup or recovery
	•	No parental controls for minors
	•	No offline attendance support
	•	No in-app notifications (email only)
	•	No help center or FAQ

⸻

14. Future Enhancements (Out of Scope)
	•	Account deletion and face data removal
	•	Offline attendance syncing
	•	Push notifications
	•	Admin dashboard
	•	Data backup and recoverys