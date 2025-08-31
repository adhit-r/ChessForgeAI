from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import structlog

from app.database.database import get_db
from app.database.models import User
from app.api.auth import get_current_user
from app.core.redis_client import get_analysis_progress
from app.services.analysis_service import get_game_analysis

logger = structlog.get_logger()
router = APIRouter()


class AnalysisStatus(BaseModel):
    games_total: int
    games_completed: int
    games_failed: int
    percentage: float
    status: str
    estimated_completion: Optional[str] = None
    is_complete: bool


@router.get("/status", response_model=AnalysisStatus)
async def get_analysis_status(current_user: User = Depends(get_current_user)):
    """Get current analysis progress"""
    try:
        progress = get_analysis_progress(current_user.id)
        
        if not progress:
            return AnalysisStatus(
                games_total=0,
                games_completed=0,
                games_failed=0,
                percentage=0,
                status="no_analysis_running",
                is_complete=True
            )
        
        games_total = progress.get('games_total', 0)
        games_completed = progress.get('games_completed', 0)
        games_failed = progress.get('games_failed', 0)
        percentage = progress.get('percentage', 0)
        status = progress.get('status', 'unknown')
        
        # Calculate completion
        is_complete = percentage >= 100 or status == 'completed'
        
        # Estimate completion time
        estimated_completion = None
        if percentage > 0 and percentage < 100:
            # Simple estimation based on progress rate
            estimated_minutes = int((100 - percentage) * 2)  # Rough estimate
            estimated_completion = f"{estimated_minutes} minutes"
        
        return AnalysisStatus(
            games_total=games_total,
            games_completed=games_completed,
            games_failed=games_failed,
            percentage=round(percentage, 1),
            status=status,
            estimated_completion=estimated_completion,
            is_complete=is_complete
        )
        
    except Exception as e:
        logger.error(f"Failed to get analysis status for user {current_user.id}", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get analysis status"
        )


@router.get("/games/{game_id}")
async def get_game_analysis_endpoint(
    game_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed analysis for a specific game"""
    try:
        analysis = await get_game_analysis(game_id, current_user.id, db)
        
        if not analysis:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Game not found or not analyzed"
            )
        
        return analysis
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get game analysis for game {game_id}", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get game analysis"
        )
