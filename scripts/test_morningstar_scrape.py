import requests
from bs4 import BeautifulSoup
import json
import sys

def scrape_morningstar_portfolio(url):
    print(f"Scraping: {url}\n")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Look for the main holding table. Usually has class 'portfolio_table' or similar
        # Morningstar tables often use specific tr structure
        holdings = []
        
        # Let's try to find tables that look like portfolio holdings
        tables = soup.find_all('table', {'id': 'stock_table'})
        if not tables:
             tables = soup.find_all('table', {'class': 'm-data-table'})
        if not tables:
            print("Could not find standard portfolio tables. Dumping all table headers to see what's available:")
            all_tables = soup.find_all('table')
            for i, tbl in enumerate(all_tables):
                headers = [th.text.strip() for th in tbl.find_all('th')]
                if headers:
                    print(f"Table {i+1} headers: {headers}")
            return
            
        print("Found portfolio table. Extracting headers:")
        table = tables[0]
        ths = table.find_all('th')
        headers = [th.text.strip() for th in ths]
        print(f"Columns Available: {headers}\n")
        
    except Exception as e:
        print(f"Error scraping: {e}")

if __name__ == "__main__":
    # Test with a popular fund: Parag Parikh Flexi Cap Fund
    test_url = "https://www.morningstar.in/mutualfunds/f00000pd1a/parag-parikh-flexi-cap-fund-direct-plan-growth/detailed-portfolio.aspx"
    scrape_morningstar_portfolio(test_url)
