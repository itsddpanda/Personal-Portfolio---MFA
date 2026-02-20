import casparser
import json
from datetime import date, datetime
from decimal import Decimal

def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Type {type(obj)} not serializable")

print(f"Reading sample.pdf with password...")
try:
    data = casparser.read_cas_pdf("./data/sample.pdf", "Welcome@12")
    with open("./data/cas_raw_dump.json", "w") as f:
        json.dump(data, f, indent=2, default=str)
    # print(json.dumps(data, indent=2, default=json_serial))
except Exception as e:
    print(f"Error: {e}")
