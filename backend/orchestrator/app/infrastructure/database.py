"""
File: orchestrator/app/infrastructure/database.py
Description: Asynchronous PostgreSQL database engine setup, ORM schemas, and helper functions 
             for persistence of tutoring session logs and telemetry analysis.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional
from sqlalchemy import String, Text, DateTime, Boolean, Integer, Float, ForeignKey, JSON
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.core.config import settings
from app.core.logging import logger

# Declare declarative base
class Base(DeclarativeBase):
    pass

class SessionLog(Base):
    """
    ORM Model capturing metadata and status of active tutoring sessions.
    """
    __tablename__ = "session_logs"

    session_id: Mapped[str] = mapped_column(String(100), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    subject: Mapped[Optional[str]] = mapped_column(String(50))
    grade_level: Mapped[str] = mapped_column(String(50))
    language: Mapped[str] = mapped_column(String(10))
    original_raw_query: Mapped[Optional[str]] = mapped_column(Text)
    solved_steps: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSON)
    practice_mode: Mapped[bool] = mapped_column(Boolean, default=False)
    worksheet_data: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)
    image_uri: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    session_title: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)
    session_title_khmer: Mapped[Optional[str]] = mapped_column(String(200), nullable=True)

    turns: Mapped[List["TelemetryLog"]] = relationship(
        back_populates="session", cascade="all, delete-orphan", lazy="selectin"
    )


class TelemetryLog(Base):
    """
    ORM Model capturing granular telemetry for each interactive query (student attempt).
    """
    __tablename__ = "telemetry_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(
        String(100), ForeignKey("session_logs.session_id", ondelete="CASCADE"), index=True
    )
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    user_query: Mapped[str] = mapped_column(Text)
    tutor_response: Mapped[str] = mapped_column(Text)
    step_index: Mapped[int] = mapped_column(Integer)
    hint_count: Mapped[int] = mapped_column(Integer)
    is_mistake: Mapped[bool] = mapped_column(Boolean)
    processing_time_ms: Mapped[float] = mapped_column(Float)
    metadata_json: Mapped[Optional[Dict[str, Any]]] = mapped_column(JSON, nullable=True)

    session: Mapped["SessionLog"] = relationship(back_populates="turns")


# Setup Engine and async session factory
primary_db_url = settings.DATABASE_URL
engine = create_async_engine(primary_db_url, echo=False, connect_args={"timeout": 1.5} if "postgresql" in primary_db_url else {})
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

_db_available: bool = False
_db_engine_type: str = "postgresql"

async def init_db():
    """
    Initializes database tables during application startup.
    Gracefully falls back to persistent SQLite if PostgreSQL is unreachable.
    """
    global engine, AsyncSessionLocal, _db_available, _db_engine_type
    logger.info("Initializing database tables...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        _db_available = True
        _db_engine_type = "postgresql" if "postgresql" in str(engine.url) else "sqlite"
        logger.info(f"Database ({_db_engine_type}) initialized successfully.")
    except Exception as e:
        logger.warning(
            f"Postgres database unavailable ({e}). "
            "Switching to local persistent SQLite database ('sqlite+aiosqlite:///homework_ocr.db')."
        )
        try:
            from pathlib import Path
            db_path = Path(__file__).resolve().parent.parent.parent / "homework_ocr.db"
            sqlite_url = f"sqlite+aiosqlite:///{db_path}"
            engine = create_async_engine(sqlite_url, echo=False)
            AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            _db_available = True
            _db_engine_type = "sqlite"
            logger.info(f"SQLite database initialized successfully at: {db_path}")
        except Exception as sql_err:
            _db_available = False
            logger.error(f"Failed to initialize SQLite fallback database: {sql_err}")


async def save_session_and_telemetry(
    session_id: str,
    subject: Optional[str],
    grade_level: str,
    language: str,
    original_raw_query: Optional[str],
    solved_steps: Optional[List[Dict[str, Any]]],
    practice_mode: bool,
    user_query: str,
    tutor_response: str,
    step_index: int,
    hint_count: int,
    is_mistake: bool,
    processing_time_ms: float,
    metadata_json: Optional[Dict[str, Any]] = None,
    worksheet_data: Optional[Dict[str, Any]] = None,
    image_uri: Optional[str] = None,
    session_title: Optional[str] = None,
    session_title_khmer: Optional[str] = None
):
    """
    Saves session metadata (upserts) and inserts a telemetry record inside a transaction.
    """
    if not _db_available:
        return

    try:
        async with AsyncSessionLocal() as session:
            async with session.begin():
                # 1. Upsert SessionLog
                db_session = await session.get(SessionLog, session_id)
                if not db_session:
                    logger.info(f"Database: Creating new SessionLog for '{session_id}'")
                    db_session = SessionLog(
                        session_id=session_id,
                        subject=subject,
                        grade_level=grade_level,
                        language=language,
                        original_raw_query=original_raw_query,
                        solved_steps=solved_steps,
                        practice_mode=practice_mode,
                        worksheet_data=worksheet_data,
                        image_uri=image_uri,
                        session_title=session_title,
                        session_title_khmer=session_title_khmer
                    )
                    session.add(db_session)
                else:
                    logger.info(f"Database: Updating existing SessionLog for '{session_id}'")
                    db_session.subject = subject
                    db_session.grade_level = grade_level
                    db_session.language = language
                    db_session.original_raw_query = original_raw_query
                    db_session.solved_steps = solved_steps
                    db_session.practice_mode = practice_mode
                    if worksheet_data is not None:
                        db_session.worksheet_data = worksheet_data
                    if image_uri is not None:
                        db_session.image_uri = image_uri
                    if session_title is not None:
                        db_session.session_title = session_title
                    if session_title_khmer is not None:
                        db_session.session_title_khmer = session_title_khmer
                    db_session.updated_at = datetime.utcnow()

                # 2. Insert TelemetryLog turn
                telemetry = TelemetryLog(
                    session_id=session_id,
                    user_query=user_query,
                    tutor_response=tutor_response,
                    step_index=step_index,
                    hint_count=hint_count,
                    is_mistake=is_mistake,
                    processing_time_ms=processing_time_ms,
                    metadata_json=metadata_json
                )
                session.add(telemetry)
            
            logger.info(f"Database: Saved session & telemetry turn for '{session_id}' successfully.")
    except Exception as e:
        logger.warning(f"Database: Could not persist telemetry for '{session_id}': {e}")


async def get_all_session_logs(limit: int = 50) -> List[Dict[str, Any]]:
    """
    Fetches all persistent sessions from Postgres DB, ordered by most recently updated.
    Filters out empty/blank sessions that have 0 user turns, no worksheet, no image, and no query.
    """
    if not _db_available:
        return []

    try:
        from sqlalchemy import select
        from sqlalchemy.orm import selectinload
        async with AsyncSessionLocal() as session:
            stmt = select(SessionLog).options(selectinload(SessionLog.turns)).order_by(SessionLog.updated_at.desc()).limit(limit)
            result = await session.execute(stmt)
            records = result.scalars().all()

            results = []
            for r in records:
                turn_count = len(r.turns) if r.turns else 0
                has_worksheet = bool(r.worksheet_data and r.worksheet_data.get("problems"))
                has_image = bool(r.image_uri)
                has_query = bool(r.original_raw_query and r.original_raw_query.strip())

                # Skip completely empty sessions where user never texted or interacted
                if turn_count == 0 and not has_worksheet and not has_image and not has_query:
                    continue

                results.append({
                    "session_id": r.session_id,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                    "updated_at": r.updated_at.isoformat() if r.updated_at else None,
                    "subject": r.subject,
                    "grade_level": r.grade_level,
                    "language": r.language,
                    "original_raw_query": r.original_raw_query,
                    "solved_steps": r.solved_steps or [],
                    "practice_mode": r.practice_mode,
                    "worksheet_data": r.worksheet_data,
                    "image_uri": r.image_uri,
                    "session_title": r.session_title,
                    "session_title_khmer": r.session_title_khmer,
                    "turn_count": turn_count,
                    "is_worksheet": has_worksheet,
                    "exercise_count": len(r.worksheet_data.get("problems", [])) if (r.worksheet_data and "problems" in r.worksheet_data) else 1,
                })
            return results
    except Exception as e:
        logger.warning(f"Database: Error fetching session logs: {e}")
        return []


async def delete_session_from_db(session_id: str) -> bool:
    """
    Deletes a session log and its cascaded telemetry logs from persistent DB.
    """
    if not _db_available:
        return False
    try:
        async with AsyncSessionLocal() as session:
            async with session.begin():
                db_session = await session.get(SessionLog, session_id)
                if db_session:
                    await session.delete(db_session)
                    logger.info(f"Database: Deleted session '{session_id}' from DB.")
                    return True
        return False
    except Exception as e:
        logger.warning(f"Database: Error deleting session '{session_id}': {e}")
        return False


async def save_worksheet_session_to_db(
    session_id: str,
    subject: Optional[str],
    grade_level: str,
    language: str,
    session_title: Optional[str],
    session_title_khmer: Optional[str],
    worksheet_data: Optional[Dict[str, Any]],
    image_uri: Optional[str] = None
):
    """
    Directly persists or updates a multi-exercise worksheet session in Postgres.
    Does not persist empty sessions without exercises or image.
    """
    if not _db_available:
        return

    # Check if there is actual content
    has_problems = bool(worksheet_data and worksheet_data.get("problems"))
    if not has_problems and not image_uri:
        return

    try:
        async with AsyncSessionLocal() as session:
            async with session.begin():
                db_session = await session.get(SessionLog, session_id)
                if not db_session:
                    db_session = SessionLog(
                        session_id=session_id,
                        subject=subject,
                        grade_level=grade_level,
                        language=language,
                        session_title=session_title,
                        session_title_khmer=session_title_khmer,
                        worksheet_data=worksheet_data,
                        image_uri=image_uri,
                        practice_mode=False
                    )
                    session.add(db_session)
                else:
                    if subject:
                        db_session.subject = subject
                    db_session.grade_level = grade_level
                    db_session.language = language
                    if session_title:
                        db_session.session_title = session_title
                    if session_title_khmer:
                        db_session.session_title_khmer = session_title_khmer
                    if worksheet_data is not None:
                        db_session.worksheet_data = worksheet_data
                    if image_uri is not None:
                        db_session.image_uri = image_uri
                    db_session.updated_at = datetime.utcnow()
            logger.info(f"Database: Saved worksheet session '{session_id}' with {len(worksheet_data.get('problems', [])) if worksheet_data else 0} exercises.")
    except Exception as e:
        logger.warning(f"Database: Error saving worksheet session '{session_id}': {e}")


async def get_student_telemetry_stats() -> Dict[str, Any]:
    """
    Computes dynamic learning streak, XP, and stats from persistent PostgreSQL session and telemetry records.
    """
    if not _db_available:
        return {
            "current_streak": 1,
            "best_streak": 1,
            "total_xp": 50,
            "total_sessions": 0,
            "total_turns": 0,
            "has_studied_today": True,
            "source": "memory"
        }

    try:
        from sqlalchemy import select, func
        from datetime import date, timedelta
        
        def to_date(val) -> Optional[date]:
            if not val:
                return None
            if isinstance(val, date) and not isinstance(val, datetime):
                return val
            if isinstance(val, datetime):
                return val.date()
            if isinstance(val, str):
                try:
                    return date.fromisoformat(val[:10])
                except Exception:
                    return None
            return None

        async with AsyncSessionLocal() as session:
            # 1. Fetch distinct dates of activity
            t_stmt = select(func.date(TelemetryLog.timestamp)).distinct()
            t_res = await session.execute(t_stmt)
            dates_set = set()
            for r in t_res.all():
                d = to_date(r[0])
                if d:
                    dates_set.add(d)

            # Also fetch session log dates
            s_stmt = select(func.date(SessionLog.created_at)).distinct()
            s_res = await session.execute(s_stmt)
            for r in s_res.all():
                d = to_date(r[0])
                if d:
                    dates_set.add(d)

            today_date = date.today()
            yesterday_date = today_date - timedelta(days=1)
            has_studied_today = today_date in dates_set

            # Calculate current consecutive streak
            current_streak = 0
            check_date = today_date if has_studied_today else yesterday_date
            while check_date in dates_set:
                current_streak += 1
                check_date -= timedelta(days=1)

            if current_streak == 0 and has_studied_today:
                current_streak = 1

            # Calculate best historical streak
            sorted_dates = sorted(list(dates_set))
            best_streak = current_streak
            temp_streak = 0
            prev_d = None
            for d in sorted_dates:
                if prev_d is None or (d - prev_d).days == 1:
                    temp_streak += 1
                elif (d - prev_d).days > 1:
                    temp_streak = 1
                prev_d = d
                if temp_streak > best_streak:
                    best_streak = temp_streak

            # 2. Count total solved turns and sessions
            turn_count_stmt = select(func.count(TelemetryLog.id))
            turn_res = await session.execute(turn_count_stmt)
            total_turns = turn_res.scalar_one_or_none() or 0

            session_count_stmt = select(func.count(SessionLog.session_id))
            sess_res = await session.execute(session_count_stmt)
            total_sessions = sess_res.scalar_one_or_none() or 0

            # Dynamic XP formula: 15 XP per telemetry turn + 50 XP per session + (current_streak * 20)
            total_xp = (total_turns * 15) + (total_sessions * 50) + (current_streak * 20)
            if total_xp == 0 and total_sessions > 0:
                total_xp = 50

            return {
                "current_streak": max(current_streak, 1 if (has_studied_today or total_sessions > 0) else 0),
                "best_streak": max(best_streak, max(current_streak, 1 if total_sessions > 0 else 0)),
                "total_xp": max(total_xp, 25 if total_sessions > 0 else 0),
                "total_sessions": total_sessions,
                "total_turns": total_turns,
                "has_studied_today": has_studied_today or total_sessions > 0,
                "active_days_count": len(dates_set),
                "source": _db_engine_type
            }
    except Exception as e:
        logger.warning(f"Database: Error calculating telemetry stats: {e}")
        return {
            "current_streak": 1,
            "best_streak": 1,
            "total_xp": 50,
            "total_sessions": 0,
            "total_turns": 0,
            "has_studied_today": True,
            "source": "fallback"
        }


