import yfinance as yf
import json

def test_indian_mf(ticker_symbol):
    print(f"\n--- Testing yfinance against: {ticker_symbol} ---\n")
    try:
        mf = yf.Ticker(ticker_symbol)
        
        info = mf.info
        print(f"Basic Info Keys Extracted: {len(info.keys()) if info else 0}")
        if info:
            print(f"Name: {info.get('shortName', 'N/A')}")
            print(f"Category: {info.get('categoryName', 'N/A')}")
            print(f"Sector Name: {info.get('sectorWeightings', 'N/A')}") 
            # Trying specifically to find Holdings/Sector
            print("\nSearching for Holdings/Sector data in info dict:")
            holdings_keys = [k for k in info.keys() if 'holding' in k.lower() or 'sector' in k.lower()]
            print(f"Keys found: {holdings_keys}")
            for k in holdings_keys:
                print(f" - {k}: {info[k]}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    # Test 1: SBI Small Cap Fund (Direct Growth) - Yahoo Ticker usually ends in .BO or .NS for India
    # Finding the exact ticker for Indian MFs on Yahoo is tricky. Often they use ISIN or a custom symbol.
    # Let's try 0P0000XW0F.BO (SBI Small Cap Fund Direct Growth Yahoo Symbol)
    test_indian_mf("0P0000XW0F.BO")
