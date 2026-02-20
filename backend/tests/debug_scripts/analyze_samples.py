import os
import json
import shutil
from sqlmodel import Session, create_engine, SQLModel, select
from app.services.cas_service import process_cas_data
from app.models.models import User, Portfolio, Folio, Scheme, Transaction, AMC
import casparser
# Helper for JSON serialization
from datetime import date, datetime
from decimal import Decimal

def json_serial(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Type {type(obj)} not serializable")

from uuid import uuid4

def run_analysis():
    # Setup In-Memory DB
    engine = create_engine("sqlite:///:memory:")
    SQLModel.metadata.create_all(engine)
    
    password = "Welcome@12"
    samples = ["sample.pdf", "sample1.pdf", "sample 2.pdf"]
    
    with Session(engine) as session:
        # Create Dummy User
        test_user_id = uuid4()
        # Use PAN from sample.pdf (AVYPR0077R) to avoid mismatch error
        user = User(id=test_user_id, name="Test User", email="test@example.com", password_hash="hash", pan="AVYPR0077R")
        session.add(user)
        session.commit()
        
        for filename in samples:
            # Check /data first (container path), then current directory (host fallback)
            filepath = os.path.join("/data", filename)
            if not os.path.exists(filepath):
                 filepath = os.path.join(os.getcwd(), "data", filename) # Fallback for local run
            
            if not os.path.exists(filepath):
                print(f"Skipping {filename} (not found in /data or ./data)")
                continue
                
            print(f"Processing {filename}...")
            
            # 1. CAS Schema Dump (Raw)
            try:
                data = casparser.read_cas_pdf(filepath, password)
                schema_dump_path = f"/data/cas_schema_{filename.replace(' ', '_')}.json"
                with open(schema_dump_path, "w") as f:
                    json.dump(data, f, indent=2, default=json_serial)
                print(f"  Saved raw schema to {schema_dump_path}")
            except Exception as e:
                print(f"  Failed to parse schema for {filename}: {e}")
                # Don't continue, try to process anyway (maybe file exists)
                # continue

            # 2. CAS Import Dump (Processed)
            try:
                with open(filepath, "rb") as f:
                    content = f.read()
                
                # Run Processing
                # This function writes to 'data/cas_import_dump.json' internally
                process_cas_data(session, content, password, x_user_id=str(test_user_id))
                
                # VERIFICATION
                users = session.exec(select(User)).all().__len__()
                portfolios = session.exec(select(Portfolio)).all().__len__()
                folios = session.exec(select(Folio)).all().__len__()
                txns = session.exec(select(Transaction)).all().__len__()
                
                print(f"  [DEBUG] DB Counts -> Users: {users}, Portfolios: {portfolios}, Folios: {folios}, Txns: {txns}")
                
                # Move the internal dump to a specific file
                if os.path.exists("/data/cas_import_dump.json"):
                    import_dump_path = f"/data/cas_import_dump_{filename.replace(' ', '_')}.json"
                    shutil.copy("/data/cas_import_dump.json", import_dump_path)
                    print(f"  Saved import dump to {import_dump_path}")
                else:
                    print("  Warning: /data/cas_import_dump.json was not generated.")
                    
            except Exception as e:
                print(f"  Failed to process import for {filename}: {e}")

if __name__ == "__main__":
    # Ensure data directory exists
    os.makedirs("data", exist_ok=True)
    run_analysis()
