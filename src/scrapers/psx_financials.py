"""PSX financial data scraper."""

import requests
from bs4 import BeautifulSoup
from typing import Dict, Optional
import re
from tenacity import retry, stop_after_attempt, wait_exponential
from loguru import logger
import pdfplumber


class PSXFinancialScraper:
    """Scraper for PSX company financial data."""

    BASE_URL = "https://www.psx.com.pk"

    def __init__(self):
        """Initialize scraper."""
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=2, max=10))
    def get_company_financials(self, ticker: str) -> Dict:
        """
        Fetch company financial data from PSX website.

        Args:
            ticker: Stock ticker symbol (e.g., 'OGDC')

        Returns:
            Dictionary with financial data
        """
        try:
            logger.info(f"Fetching financials for {ticker}")

            # Construct URL - this may need adjustment based on actual PSX structure
            url = f"{self.BASE_URL}/company/{ticker.lower()}/financials"

            response = self.session.get(url, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')

            # Extract financial data from HTML tables
            # Note: Actual selectors depend on PSX website structure
            financials = {
                'ticker': ticker,
                'revenue': self._extract_value(soup, 'Revenue'),
                'net_income': self._extract_value(soup, 'Net Income'),
                'total_assets': self._extract_value(soup, 'Total Assets'),
                'total_equity': self._extract_value(soup, 'Total Equity'),
                'operating_cash_flow': self._extract_value(soup, 'Operating Cash Flow'),
                'free_cash_flow': self._extract_value(soup, 'Free Cash Flow'),
                'dividend_per_share': self._extract_value(soup, 'Dividend Per Share'),
            }

            logger.info(f"✓ Fetched financials for {ticker}")
            return financials

        except requests.RequestException as e:
            logger.error(f"✗ Failed to fetch financials for {ticker}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"✗ Error parsing financials for {ticker}: {str(e)}")
            raise

    def _extract_value(self, soup: BeautifulSoup, label: str) -> Optional[float]:
        """Extract financial value from HTML content."""
        try:
            # This is a placeholder - actual implementation depends on HTML structure
            pattern = rf'{label}\s*[:\-]?\s*([\d,\.]+)'
            text = soup.get_text()
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return float(match.group(1).replace(',', ''))
        except (AttributeError, ValueError):
            pass
        return None

    @retry(stop=stop_after_attempt(2), wait=wait_exponential(multiplier=1, min=5, max=15))
    def download_annual_report(self, ticker: str, year: int) -> Optional[bytes]:
        """Download annual report PDF for a company."""
        try:
            logger.info(f"Downloading annual report for {ticker} ({year})")

            # Construct URL - may need adjustment
            url = f"{self.BASE_URL}/announcements/{ticker}_{year}_annual_report.pdf"

            response = self.session.get(url, timeout=30)
            response.raise_for_status()

            logger.info(f"✓ Downloaded annual report for {ticker} ({year})")
            return response.content

        except requests.RequestException as e:
            logger.warning(f"Failed to download report for {ticker} ({year}): {str(e)}")
            return None

    def extract_financials_from_pdf(self, pdf_content: bytes) -> Dict[str, float]:
        """
        Extract financial metrics from PDF using pdfplumber.

        Args:
            pdf_content: PDF file content in bytes

        Returns:
            Dictionary with extracted financial metrics
        """
        try:
            logger.info("Extracting financials from PDF")
            financials = {}

            with pdfplumber.open(pdf_content) as pdf:
                text = ""
                for page in pdf.pages:
                    page_text = page.extract_text() or ""
                    text += page_text

                # Extract key financial metrics using regex patterns
                patterns = {
                    'revenue': r'Revenue\s*[:\-]?\s*([\d,]+\.?\d*)',
                    'net_income': r'Net\s+Income\s*[:\-]?\s*([\d,]+\.?\d*)',
                    'total_assets': r'Total\s+Assets\s*[:\-]?\s*([\d,]+\.?\d*)',
                    'total_equity': r'Total\s+Equity\s*[:\-]?\s*([\d,]+\.?\d*)',
                    'eps': r'EPS\s*[:\-]?\s*([\d,]+\.?\d*)',
                    'dividend': r'Dividend\s*[:\-]?\s*([\d,]+\.?\d*)',
                }

                for key, pattern in patterns.items():
                    match = re.search(pattern, text, re.IGNORECASE)
                    if match:
                        try:
                            financials[key] = float(match.group(1).replace(',', ''))
                        except ValueError:
                            pass

            logger.info(f"✓ Extracted {len(financials)} metrics from PDF")
            return financials

        except Exception as e:
            logger.error(f"✗ Error extracting financials from PDF: {str(e)}")
            return {}

    def get_all_companies_list(self) -> list:
        """Get list of all companies listed on PSX."""
        try:
            logger.info("Fetching list of all PSX companies")

            url = f"{self.BASE_URL}/companies"
            response = self.session.get(url, timeout=10)
            response.raise_for_status()

            soup = BeautifulSoup(response.content, 'html.parser')
            companies = []

            # Extract company data - implementation depends on HTML structure
            # This is a placeholder
            logger.warning("Actual company list extraction not implemented - uses placeholder")

            return companies

        except Exception as e:
            logger.error(f"✗ Error fetching companies list: {str(e)}")
            return []
