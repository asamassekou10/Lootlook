"""
SerpApi Pricing Service - Market price lookup.

Uses SerpApi to query Google Shopping for current listings
and calculate accurate market value estimates.
"""

import logging
import statistics
from typing import Any

from serpapi import GoogleSearch

from app.schemas.loot import PriceDataResult

logger = logging.getLogger(__name__)


class SerpApiPricingService:
    """Real SerpApi service for pricing data with outlier filtering."""

    def __init__(self, api_key: str):
        """Initialize with SerpApi key."""
        if not api_key:
            raise ValueError("SerpApi key is required")
        self.api_key = api_key

    async def get_price_data(self, query: str) -> PriceDataResult:
        """
        Get pricing data for an item query with outlier filtering.

        Args:
            query: Search query (e.g., "Nike Air Jordan 1 Retro")

        Returns:
            PriceDataResult with filtered min, max, avg prices
        """
        try:
            # Search Google Shopping
            params = {
                "engine": "google_shopping",
                "q": query,
                "api_key": self.api_key,
                "gl": "us",
                "hl": "en",
                "num": 30,  # Get more results for better averaging
            }

            search = GoogleSearch(params)
            results = search.get_dict()

            # Extract shopping results
            shopping_results = results.get("shopping_results", [])

            if not shopping_results:
                logger.warning(f"No shopping results found for: {query}")
                return PriceDataResult(source_count=0)

            # Parse and filter prices
            prices = self._extract_prices(shopping_results)

            if not prices:
                return PriceDataResult(source_count=len(shopping_results))

            # Remove outliers using IQR method for more accurate range
            filtered_prices = self._remove_outliers(prices)

            if not filtered_prices:
                filtered_prices = prices  # Fall back to original if filtering removes all

            # Calculate statistics
            avg_price = statistics.mean(filtered_prices)

            # Use a tighter range: show 25th to 75th percentile
            if len(filtered_prices) >= 4:
                sorted_prices = sorted(filtered_prices)
                q1_idx = len(sorted_prices) // 4
                q3_idx = (3 * len(sorted_prices)) // 4
                min_price = sorted_prices[q1_idx]
                max_price = sorted_prices[q3_idx]
            else:
                min_price = min(filtered_prices)
                max_price = max(filtered_prices)

            return PriceDataResult(
                min_price=round(min_price, 2),
                max_price=round(max_price, 2),
                avg_price=round(avg_price, 2),
                currency="USD",
                source_count=len(filtered_prices),
            )

        except Exception as e:
            logger.error(f"SerpApi error: {e}")
            return PriceDataResult(source_count=0)

    def _extract_prices(self, shopping_results: list[dict[str, Any]]) -> list[float]:
        """Extract numeric prices from shopping results."""
        prices = []

        for item in shopping_results:
            # Try different price fields
            price = item.get("extracted_price")

            if price is None:
                # Try parsing from price string
                price_str = item.get("price", "")
                price = self._parse_price_string(price_str)

            if price is not None and price > 0:
                prices.append(float(price))

        return prices

    def _remove_outliers(self, prices: list[float]) -> list[float]:
        """
        Remove outliers using the IQR (Interquartile Range) method.

        This filters out unusually high or low prices that would
        skew the estimate.
        """
        if len(prices) < 4:
            return prices

        sorted_prices = sorted(prices)
        n = len(sorted_prices)

        q1_idx = n // 4
        q3_idx = (3 * n) // 4

        q1 = sorted_prices[q1_idx]
        q3 = sorted_prices[q3_idx]
        iqr = q3 - q1

        # Use 1.5 * IQR rule (standard for outlier detection)
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr

        return [p for p in prices if lower_bound <= p <= upper_bound]

    def _parse_price_string(self, price_str: str) -> float | None:
        """Parse a price string like '$149.99' to float."""
        if not price_str:
            return None

        try:
            # Remove currency symbols and commas
            cleaned = price_str.replace("$", "").replace(",", "").strip()

            # Handle price ranges (take the first price)
            if " - " in cleaned:
                cleaned = cleaned.split(" - ")[0]
            if " to " in cleaned.lower():
                cleaned = cleaned.lower().split(" to ")[0]

            return float(cleaned)

        except (ValueError, AttributeError):
            return None
