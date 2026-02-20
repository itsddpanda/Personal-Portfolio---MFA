import os
import json

def generate_isin_map():
    nav_file = "/home/panda/mfa/data/NAVAll.txt"
    output_file = "/home/panda/mfa/data/isin_amfi_map.json"
    
    if not os.path.exists(nav_file):
        print(f"Error: {nav_file} not found.")
        return

    isin_map = {}
    
    try:
        with open(nav_file, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                parts = line.split(";")
                if len(parts) < 6:
                    continue
                
                # Structure: Scheme Code;ISIN Div Payout/ ISIN Growth;ISIN Div Reinvestment;...
                amfi_code = parts[0].strip()
                isin1 = parts[1].strip()
                isin2 = parts[2].strip()
                
                if not amfi_code.isdigit():
                    continue
                
                # Map both ISINs to the scheme code
                if isin1 and isin1 != "-":
                    isin_map[isin1] = amfi_code
                if isin2 and isin2 != "-":
                    isin_map[isin2] = amfi_code
                    
        with open(output_file, "w") as f:
            json.dump(isin_map, f, indent=2)
            
        print(f"Successfully generated {output_file} with {len(isin_map)} entries.")
        
    except Exception as e:
        print(f"Failed to generate map: {e}")

if __name__ == "__main__":
    generate_isin_map()
