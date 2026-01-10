"""
Analytics router for attendance statistics and reports.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
import os

from app.database import get_db
from app.crud import analytics as analytics_crud
from app.schemas.analytics import (
    UserStatistics, 
    SessionLog, 
    TodayAttendance, 
    StudentStatistics
)
from app.auth.oauth2 import get_current_user
from app.models import User, ClassUser, Class

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])


def _check_class_access(db: Session, user_id: int, class_id: int) -> ClassUser:
    """Check if user has access to the class."""
    class_user = db.query(ClassUser).filter(
        ClassUser.class_id == class_id,
        ClassUser.user_id == user_id
    ).first()
    
    if not class_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this class"
        )
    return class_user


def _check_creator_access(db: Session, user_id: int, class_id: int) -> None:
    """Check if user is the class creator/admin."""
    class_user = db.query(ClassUser).filter(
        ClassUser.class_id == class_id,
        ClassUser.user_id == user_id,
        ClassUser.role == "admin"
    ).first()
    
    if not class_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only class creators can access this information"
        )


@router.get("/user/{user_id}/class/{class_id}/statistics", response_model=UserStatistics)
def get_user_statistics(
    user_id: int,
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get attendance statistics for a specific user in a class.
    
    - Students can only view their own statistics
    - Class admins can view any student's statistics
    """
    # Check if requesting own stats or if admin
    if current_user.user_id != user_id:
        _check_creator_access(db, current_user.user_id, class_id)
    else:
        _check_class_access(db, current_user.user_id, class_id)
    
    stats = analytics_crud.calculate_user_attendance_percentage(db, user_id, class_id)
    return UserStatistics(**stats)


@router.get("/classes/{class_id}/logs", response_model=List[SessionLog])
def get_class_attendance_logs(
    class_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get attendance logs per session for a class.
    Only class creators/admins can view full logs.
    """
    _check_creator_access(db, current_user.user_id, class_id)
    
    logs = analytics_crud.get_class_attendance_logs(db, class_id, skip, limit)
    return [SessionLog(**log) for log in logs]


@router.get("/classes/{class_id}/today", response_model=TodayAttendance)
def get_today_attendance(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get today's attendance status for all students in a class.
    Only class creators/admins can view this.
    """
    _check_creator_access(db, current_user.user_id, class_id)
    
    data = analytics_crud.get_today_attendance(db, class_id)
    return TodayAttendance(**data)


@router.get("/classes/{class_id}/students", response_model=List[StudentStatistics])
def get_students_statistics(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get attendance statistics for all students in a class.
    Only class creators/admins can view this.
    """
    _check_creator_access(db, current_user.user_id, class_id)
    
    stats = analytics_crud.get_students_statistics(db, class_id)
    return [StudentStatistics(**s) for s in stats]


@router.get("/classes/{class_id}/attendance/export")
async def export_attendance_history(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Export full attendance history as Excel file.
    Columns: Student info, then one column per session date.
    Only class creators/admins can export.
    """
    _check_creator_access(db, current_user.user_id, class_id)
    
    # Get class info
    class_info = db.query(Class).filter(Class.class_id == class_id).first()
    if not class_info:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Get attendance data
    data = analytics_crud.get_attendance_history_for_export(db, class_id)
    
    # Create Excel workbook
    wb = Workbook()
    ws = wb.active
    ws.title = "Attendance History"
    
    # Styles
    header_font = Font(bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="6d28d9", end_color="6d28d9", fill_type="solid")
    present_fill = PatternFill(start_color="10b981", end_color="10b981", fill_type="solid")
    absent_fill = PatternFill(start_color="ef4444", end_color="ef4444", fill_type="solid")
    thin_border = Border(
        left=Side(style='thin'),
        right=Side(style='thin'),
        top=Side(style='thin'),
        bottom=Side(style='thin')
    )
    
    # Headers
    headers = ["#", "Name", "Email"]
    for session in data["sessions"]:
        headers.append(f"{session['date']}\n{session['topic'] or 'Session'}")
    headers.append("Attendance %")
    
    for col_num, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_num, value=header)
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        cell.border = thin_border
    
    # Data rows
    for row_num, student in enumerate(data["students"], 2):
        # Number
        ws.cell(row=row_num, column=1, value=row_num - 1).border = thin_border
        
        # Name
        ws.cell(row=row_num, column=2, value=f"{student['name']} {student['prenom']}").border = thin_border
        
        # Email
        ws.cell(row=row_num, column=3, value=student['email']).border = thin_border
        
        # Attendance per session
        present_count = 0
        for col_offset, session in enumerate(data["sessions"]):
            col_num = 4 + col_offset
            status = student['attendance'].get(session['session_id'], 'absent')
            cell = ws.cell(row=row_num, column=col_num, value="✓" if status == "present" else "✗")
            cell.alignment = Alignment(horizontal="center")
            cell.fill = present_fill if status == "present" else absent_fill
            cell.border = thin_border
            if status == "present":
                present_count += 1
        
        # Percentage
        total = len(data["sessions"])
        percentage = (present_count / total * 100) if total > 0 else 100
        perc_cell = ws.cell(row=row_num, column=len(headers), value=f"{percentage:.1f}%")
        perc_cell.alignment = Alignment(horizontal="center")
        perc_cell.border = thin_border
        if percentage < 75:
            perc_cell.font = Font(color="FF0000", bold=True)
    
    # Auto-adjust column widths
    ws.column_dimensions['A'].width = 5
    ws.column_dimensions['B'].width = 25
    ws.column_dimensions['C'].width = 30
    for i in range(4, len(headers)):
        ws.column_dimensions[chr(64 + i)].width = 12
    ws.column_dimensions[chr(64 + len(headers))].width = 12
    
    # Set row height for header
    ws.row_dimensions[1].height = 40
    
    # Save file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"attendance_{class_info.class_name}_{timestamp}.xlsx"
    filepath = f"/tmp/{filename}"
    wb.save(filepath)
    
    return FileResponse(
        path=filepath,
        filename=filename,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
