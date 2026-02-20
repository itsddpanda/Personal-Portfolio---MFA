import requests
import logging
from datetime import datetime, date
from typing import List, Tuple, Dict, Any, Optional

logger = logging.getLogger(__name__)

MFAPI_BASE_URL = "https://api.mfapi.in/mf"

def fetch_scheme_data(amfi_code: str) -> Optional[Dict[str, Any]]:
    """
    Fetches the full scheme data including metadata and historical NAVs from mfapi.in.
    Returns the parsed JSON dictionary or None if failed.
    """
    try:
        url = f"{MFAPI_BASE_URL}/{amfi_code}"
        logger.info(f"Fetching MFAPI data for AMFI code: {amfi_code}")
        response = requests.get(url, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            if data.get("status") == "SUCCESS":
                return data
            else:
                logger.warning(f"MFAPI returned status {data.get('status')} for {amfi_code}")
        else:
            logger.error(f"Failed to fetch scheme data for {amfi_code}: HTTP {response.status_code}")
            
    except Exception as e:
        logger.error(f"Exception fetching MFAPI data for {amfi_code}: {e}")
        
    return None

def extract_metadata(data: Dict[str, Any]) -> Dict[str, str]:
    """
    Extracts relevant metadata from the MFAPI response.
    """
    meta = data.get("meta", {})
    return {
        "fund_house": meta.get("fund_house"),
        "scheme_category": meta.get("scheme_category"),
        "scheme_type": meta.get("scheme_type")
    }

def extract_nav_history(data: Dict[str, Any]) -> List[Tuple[date, float]]:
    """
    Extracts the chronological NAV history from the MFAPI response.
    Returns a list of tuples: [(date_obj, nav_float), ...] sorted oldest to newest.
    """
    history = []
    nav_list = data.get("data", [])
    
    for entry in nav_list:
        try:
            date_str = entry.get("date")
            nav_val = float(entry.get("nav"))
            date_obj = datetime.strptime(date_str, "%d-%m-%Y").date()
            history.append((date_obj, nav_val))
        except (ValueError, TypeError) as e:
            # Skip invalid entries
            continue
            
    # MFAPI returns descending by default. Sort ascending (oldest to newest)
    history.sort(key=lambda x: x[0])
    return history
