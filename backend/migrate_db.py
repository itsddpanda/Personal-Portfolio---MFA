import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from sqlalchemy import text
from app.db.engine import engine, SQLModel

def run_migration():
    print("Running DB migration on engine:", engine.url)
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE scheme ADD COLUMN fund_house VARCHAR"))
            print("Added fund_house")
        except Exception as e:
            print(f"Skipped fund_house: {e}")
            
        try:
            conn.execute(text("ALTER TABLE scheme ADD COLUMN scheme_category VARCHAR"))
            print("Added scheme_category")
        except Exception as e:
            print(f"Skipped scheme_category: {e}")
            
        try:
            conn.execute(text("ALTER TABLE scheme ADD COLUMN scheme_type VARCHAR"))
            print("Added scheme_type")
        except Exception as e:
            print(f"Skipped scheme_type: {e}")

    # Create new tables (like navhistory if not exists)
    SQLModel.metadata.create_all(engine)
    print("Created missing tables.")

if __name__ == "__main__":
    run_migration()
