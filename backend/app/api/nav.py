from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Header
from sqlmodel import Session
from app.db.engine import get_session
from app.services.nav import sync_navs
from app.services.analytics import get_portfolio_summary
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/sync-nav")
async def trigger_nav_sync(
    background_tasks: BackgroundTasks,
    x_user_id: str = Header(None),
    session: Session = Depends(get_session)
):
    """
    Triggers a sync of NAV values and returns the updated portfolio summary.
    """
    if not x_user_id:
        raise HTTPException(status_code=400, detail="User ID header is required for sync summary.")

    try:
        # Run sync synchronously to ensure data is fresh
        sync_result = sync_navs(session)
        
        # Calculate updated summary
        summary = get_portfolio_summary(session, x_user_id)
        
        return {
            "status": "success", 
            "message": "NAV Sync completed", 
            "details": sync_result,
            "data": summary
        }
    except Exception as e:
        logger.error(f"Sync failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
