"""
Analytics CRUD operations for attendance statistics and reports.
"""
from datetime import date, datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, case

from app.models import User, Attendance, Session as SessionModel, Class, ClassUser, GroupUser, Group
from app.models.attendance import AttendanceStatus


def calculate_user_attendance_percentage(
    db: Session, 
    user_id: int, 
    class_id: int
) -> Dict[str, Any]:
    """
    Calculate attendance percentage for a specific user in a class.
    Returns: {user_id, class_id, total_sessions, attended, percentage}
    """
    # Get all sessions for this class
    total_sessions = db.query(func.count(SessionModel.session_id)).filter(
        SessionModel.class_id == class_id
    ).scalar() or 0
    
    if total_sessions == 0:
        return {
            "user_id": user_id,
            "class_id": class_id,
            "total_sessions": 0,
            "attended": 0,
            "percentage": 100.0  # No sessions means 100% by default
        }
    
    # Count sessions where user was present
    attended = db.query(func.count(Attendance.session_id)).join(
        SessionModel, Attendance.session_id == SessionModel.session_id
    ).filter(
        and_(
            SessionModel.class_id == class_id,
            Attendance.user_id == user_id,
            Attendance.status == AttendanceStatus.present
        )
    ).scalar() or 0
    
    percentage = round((attended / total_sessions) * 100, 2)
    
    return {
        "user_id": user_id,
        "class_id": class_id,
        "total_sessions": total_sessions,
        "attended": attended,
        "percentage": percentage
    }


def get_class_attendance_logs(
    db: Session, 
    class_id: int,
    skip: int = 0,
    limit: int = 50
) -> List[Dict[str, Any]]:
    """
    Get attendance logs per session for a class.
    Returns list of sessions with attendance counts.
    """
    sessions = db.query(
        SessionModel.session_id,
        SessionModel.session_topic,
        SessionModel.session_date,
        SessionModel.start_time,
        SessionModel.end_time,
        func.count(case((Attendance.status == AttendanceStatus.present, 1))).label('present_count'),
        func.count(Attendance.user_id).label('total_marked')
    ).outerjoin(
        Attendance, SessionModel.session_id == Attendance.session_id
    ).filter(
        SessionModel.class_id == class_id
    ).group_by(
        SessionModel.session_id
    ).order_by(
        SessionModel.session_date.desc(),
        SessionModel.start_time.desc()
    ).offset(skip).limit(limit).all()
    
    # Get total class members for context
    total_members = db.query(func.count(ClassUser.user_id)).filter(
        ClassUser.class_id == class_id,
        ClassUser.role != 'admin'
    ).scalar() or 0
    
    return [
        {
            "session_id": s.session_id,
            "session_topic": s.session_topic,
            "session_date": s.session_date.isoformat() if s.session_date else None,
            "start_time": str(s.start_time) if s.start_time else None,
            "end_time": str(s.end_time) if s.end_time else None,
            "present_count": s.present_count,
            "total_marked": s.total_marked,
            "total_members": total_members
        }
        for s in sessions
    ]


def get_today_attendance(
    db: Session, 
    class_id: int
) -> Dict[str, Any]:
    """
    Get today's attendance status for all students in a class.
    Returns students with their status for today's sessions.
    """
    today = date.today()
    
    # Get today's session(s) for this class
    today_sessions = db.query(SessionModel).filter(
        and_(
            SessionModel.class_id == class_id,
            SessionModel.session_date == today
        )
    ).all()
    
    # Get all students in the class
    students = db.query(
        User.user_id,
        User.name,
        User.prenom,
        User.email
    ).join(
        ClassUser, User.user_id == ClassUser.user_id
    ).filter(
        ClassUser.class_id == class_id,
        ClassUser.role != 'admin'
    ).all()
    
    result = {
        "date": today.isoformat(),
        "sessions": [],
        "students": []
    }
    
    for session in today_sessions:
        result["sessions"].append({
            "session_id": session.session_id,
            "topic": session.session_topic,
            "start_time": str(session.start_time) if session.start_time else None
        })
    
    session_ids = [s.session_id for s in today_sessions]
    
    for student in students:
        # Check attendance for each session
        attendance_status = "no_session"
        if session_ids:
            attended = db.query(Attendance).filter(
                and_(
                    Attendance.user_id == student.user_id,
                    Attendance.session_id.in_(session_ids),
                    Attendance.status == AttendanceStatus.present
                )
            ).first()
            attendance_status = "present" if attended else "absent"
        
        result["students"].append({
            "user_id": student.user_id,
            "name": student.name,
            "prenom": student.prenom,
            "email": student.email,
            "status": attendance_status
        })
    
    return result


def get_students_statistics(
    db: Session, 
    class_id: int
) -> List[Dict[str, Any]]:
    """
    Get attendance statistics for all students in a class.
    Returns list of students with their attendance percentages.
    """
    # Get total sessions for this class
    total_sessions = db.query(func.count(SessionModel.session_id)).filter(
        SessionModel.class_id == class_id
    ).scalar() or 0
    
    # Get all students in the class with attendance counts
    students = db.query(
        User.user_id,
        User.name,
        User.prenom,
        User.email,
        func.count(case((Attendance.status == AttendanceStatus.present, 1))).label('attended')
    ).join(
        ClassUser, User.user_id == ClassUser.user_id
    ).outerjoin(
        Attendance, User.user_id == Attendance.user_id
    ).outerjoin(
        SessionModel, and_(
            Attendance.session_id == SessionModel.session_id,
            SessionModel.class_id == class_id
        )
    ).filter(
        ClassUser.class_id == class_id,
        ClassUser.role != 'admin'
    ).group_by(
        User.user_id
    ).all()
    
    result = []
    for student in students:
        percentage = 100.0 if total_sessions == 0 else round((student.attended / total_sessions) * 100, 2)
        result.append({
            "user_id": student.user_id,
            "name": student.name,
            "prenom": student.prenom,
            "email": student.email,
            "total_sessions": total_sessions,
            "attended": student.attended,
            "percentage": percentage,
            "is_low": percentage < 75  # Flag for low attendance
        })
    
    # Sort by percentage ascending (worst attendance first)
    result.sort(key=lambda x: x["percentage"])
    
    return result


def get_attendance_history_for_export(
    db: Session,
    class_id: int
) -> Dict[str, Any]:
    """
    Get full attendance history for Excel export.
    Returns sessions as columns, students as rows.
    """
    # Get all sessions ordered by date
    sessions = db.query(
        SessionModel.session_id,
        SessionModel.session_topic,
        SessionModel.session_date
    ).filter(
        SessionModel.class_id == class_id
    ).order_by(
        SessionModel.session_date.asc()
    ).all()
    
    # Get all students
    students = db.query(
        User.user_id,
        User.name,
        User.prenom,
        User.email
    ).join(
        ClassUser, User.user_id == ClassUser.user_id
    ).filter(
        ClassUser.class_id == class_id,
        ClassUser.role != 'admin'
    ).order_by(
        User.name, User.prenom
    ).all()
    
    # Get all attendance records for this class
    attendance_records = db.query(
        Attendance.user_id,
        Attendance.session_id,
        Attendance.status
    ).join(
        SessionModel, Attendance.session_id == SessionModel.session_id
    ).filter(
        SessionModel.class_id == class_id
    ).all()
    
    # Build lookup dict
    attendance_lookup = {
        (a.user_id, a.session_id): a.status.value 
        for a in attendance_records
    }
    
    return {
        "sessions": [
            {
                "session_id": s.session_id,
                "topic": s.session_topic,
                "date": s.session_date.isoformat() if s.session_date else "N/A"
            }
            for s in sessions
        ],
        "students": [
            {
                "user_id": st.user_id,
                "name": st.name,
                "prenom": st.prenom,
                "email": st.email,
                "attendance": {
                    s.session_id: attendance_lookup.get((st.user_id, s.session_id), "absent")
                    for s in sessions
                }
            }
            for st in students
        ],
        "total_sessions": len(sessions)
    }
