from sqlalchemy.orm import Session
from app.models.session import Session as SessionModel, SessionMethod
from app.models.group import Group
from datetime import datetime
from typing import Optional
from datetime import time

class SessionService:
    def __init__(self, db: Session):
        self.db = db

    def create_session(
        self,
        group_id: int,
        method: SessionMethod,
        class_id: Optional[int] = None,
        session_topic: Optional[str] = None,
        start_time: Optional[time] = None,
        end_time: Optional[time] = None,
        created_by: Optional[int] = None
    ) -> SessionModel:
        """Create a new session for a group."""
        # Verify group exists
        group = self.db.query(Group).filter(Group.group_id == group_id).first()
        if not group:
            raise ValueError("Group not found")

        # Create new session
        session = SessionModel(
            group_id=group_id,
            method=method,
            is_active=True,
            created_at=datetime.utcnow(),
            class_id=class_id,
            session_topic=session_topic,
            start_time=start_time,
            end_time=end_time,
            created_by=created_by
        )
        
        self.db.add(session)
        self.db.commit()
        self.db.refresh(session)
        return session

    def get_active_session(self, group_id: int) -> SessionModel:
        """Get the active session for a group if it exists."""
        return self.db.query(SessionModel).filter(
            SessionModel.group_id == group_id,
            SessionModel.is_active == True
        ).first()

    def end_session(self, session_id: int) -> SessionModel:
        """End a session."""
        session = self.db.query(SessionModel).filter(SessionModel.session_id == session_id).first()
        if not session:
            raise ValueError("Session not found")
        
        session.end_session()
        self.db.commit()
        self.db.refresh(session)
        return session

    def get_session(self, session_id: int) -> SessionModel:
        """Get a session by ID."""
        return self.db.query(SessionModel).filter(SessionModel.session_id == session_id).first()

    def list_group_sessions(self, group_id: int, limit: int = 10) -> list[SessionModel]:
        """List recent sessions for a group."""
        return self.db.query(SessionModel)\
            .filter(SessionModel.group_id == group_id)\
            .order_by(SessionModel.created_at.desc())\
            .limit(limit)\
            .all() 