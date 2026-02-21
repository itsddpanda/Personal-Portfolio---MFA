import requests
from sqlmodel import Session, select, or_
from app.models.models import Scheme, NavHistory
from datetime import datetime, date, timedelta
import logging
import time

logger = logging.getLogger(__name__)

MFAPI_BASE_URL = "https://api.mfapi.in/mf"

def scrape_amfi_portal_fallback(amfi_code: str):
    """
    Scrapes the AMFI portal for a specific scheme's recent NAV history when the main API fails.
    Since we don't know the exact last date, we request the last 5 days.
    """
    try:
        # Request data from 5 days ago to today
        start_date = (date.today() - timedelta(days=5)).strftime("%d-%b-%Y")
        url = f"https://portal.amfiindia.com/DownloadNAVHistoryReport_Po.aspx?frmdt={start_date}"
        
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code == 200:
            lines = response.text.splitlines()
            # We need to find our specific amfi_code in this bulk dump
            
            latest_nav = None
            latest_date = None
            
            for line in lines:
                parts = line.split(";")
                if len(parts) >= 8 and parts[0].strip() == amfi_code:
                    nav_str = parts[4].strip()
                    date_str = parts[7].strip()
                    
                    try:
                        nav_val = float(nav_str)
                        date_obj = datetime.strptime(date_str, "%d-%b-%Y").date()
                        
                        # Keep the most recent one (the file is usually chronological, but we ensure max date)
                        if not latest_date or date_obj > latest_date:
                            latest_nav = nav_val
                            latest_date = date_obj
                    except ValueError:
                        pass
                        
            if latest_nav and latest_date:
                logger.info(f"Fallback scraper succeeded for {amfi_code}")
                return latest_nav, latest_date
                
    except Exception as e:
        logger.warning(f"Fallback scraper also failed for {amfi_code}: {e}")
        
    return None, None

def fetch_latest_nav(amfi_code: str):
    """
    Fetches the latest NAV from mfapi.in. If that fails (e.g., 502), falls back to scraping AMFI.
    Returns: (nav: float, date: date) or (None, None)
    """
    try:
        url = f"{MFAPI_BASE_URL}/{amfi_code}"
        response = requests.get(url, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "SUCCESS" or len(data.get("data", [])) > 0:
                nav_list = data.get("data", [])
                if nav_list:
                    latest = nav_list[0]
                    date_str = latest.get("date")
                    nav_val = float(latest.get("nav"))
                    
                    date_obj = datetime.strptime(date_str, "%d-%m-%Y").date()
                    return nav_val, date_obj
        else:
            logger.warning(f"Failed to fetch NAV from mfapi.in for {amfi_code}: Status {response.status_code}. Using fallback.")
            
    except Exception as e:
        logger.warning(f"Error fetching NAV from mfapi.in for {amfi_code}: {e}. Using fallback.")
        
    # Trigger fallback if we reach here
    return scrape_amfi_portal_fallback(amfi_code)

def sync_navs(session: Session):
    """
    Iterates through all schemes with AMFI codes that are missing NAVs (latest_nav IS NULL)
    and updates their NAVs using the fallback mfapi.in API.
    """
    three_days_ago = date.today() - timedelta(days=3)
    schemes = session.exec(
        select(Scheme).where(
            Scheme.amfi_code != None, 
            or_(
                Scheme.latest_nav == None,
                Scheme.latest_nav_date < three_days_ago
            )
        )
    ).all()
    updated_count = 0
    errors = 0
    
    # Debug Data
    debug_dump = {}

    for scheme in schemes:
        if not scheme.amfi_code:
            continue
            
        nav, nav_date = fetch_latest_nav(scheme.amfi_code)
        
        # Debug Entry
        debug_dump[scheme.isin] = {
            "name": scheme.name,
            "amfi": scheme.amfi_code,
            "api_nav": nav,
            "api_date": str(nav_date) if nav_date else None,
            "status": "success" if nav else "failed"
        }
        
        if nav and nav_date:
            # Update Scheme Cache
            scheme.latest_nav = nav
            scheme.latest_nav_date = nav_date
            session.add(scheme)
            
            # Add to History (Idempotent check)
            exists = session.exec(
                select(NavHistory).where(
                    NavHistory.scheme_id == scheme.id,
                    NavHistory.date == nav_date
                )
            ).first()
            
            if not exists:
                history = NavHistory(
                    scheme_id=scheme.id,
                    date=nav_date,
                    nav=nav
                )
                session.add(history)
            
            updated_count += 1
            # Rate limit politeness
            time.sleep(0.1) 
        else:
            errors += 1
            
    session.commit()
    
    # Write Debug Dump
    import json
    try:
        with open("/data/nav_sync_dump.json", "w") as f:
            json.dump(debug_dump, f, indent=2, default=str)
        logger.info("NAV sync dump written to /data/nav_sync_dump.json")
    except Exception as e:
        logger.error(f"Failed to write NAV dump: {e}")

    return {"updated": updated_count, "errors": errors}
