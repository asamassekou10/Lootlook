"""
Appraiser Service - Core business logic for item identification and pricing.

This service orchestrates:
1. Gemini Vision API for item identification
2. SerpApi for market price data
3. Combines results into a unified LootAnalysisResponse
"""

import random
from typing import Protocol

from app.schemas.loot import (
    GeminiVisionResult,
    LootAnalysisResponse,
    PriceDataResult,
)


class VisionService(Protocol):
    """Protocol for vision-based item identification services."""

    async def identify_item(self, image_data: bytes) -> GeminiVisionResult:
        """Identify an item from image data."""
        ...


class PricingService(Protocol):
    """Protocol for pricing lookup services."""

    async def get_price_data(self, query: str) -> PriceDataResult:
        """Get pricing data for a search query."""
        ...


class MockGeminiService:
    """Mock Gemini Vision service for development."""

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key

    async def identify_item(self, image_data: bytes) -> GeminiVisionResult:
        """
        Mock identification - returns dummy data.

        TODO: Replace with actual Gemini API call:
        ```
        import google.generativeai as genai
        genai.configure(api_key=self.api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content([prompt, image])
        ```
        """
        mock_items = [
            GeminiVisionResult(
                brand="Nike",
                model="Air Jordan 1 Retro High OG",
                condition="Excellent",
                color="Chicago Red/White/Black",
                category="Sneakers",
                raw_description="Classic high-top basketball sneaker"
            ),
            GeminiVisionResult(
                brand="Apple",
                model="iPhone 14 Pro",
                condition="Good",
                color="Space Black",
                category="Electronics",
                raw_description="Smartphone with minor scratches"
            ),
            GeminiVisionResult(
                brand="Vintage",
                model="1985 Coca-Cola Sign",
                condition="Fair",
                color="Red/White",
                category="Vintage",
                raw_description="Original metal advertising sign"
            ),
        ]
        return random.choice(mock_items)


class MockSerpApiService:
    """Mock SerpApi service for development."""

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key

    async def get_price_data(self, query: str) -> PriceDataResult:
        """
        Mock price lookup - returns dummy data.

        TODO: Replace with actual SerpApi call:
        ```
        from serpapi import GoogleSearch
        params = {
            "engine": "google_shopping",
            "q": query,
            "api_key": self.api_key
        }
        search = GoogleSearch(params)
        results = search.get_dict()
        ```
        """
        mock_prices = {
            "sneakers": PriceDataResult(
                min_price=150.0,
                max_price=350.0,
                avg_price=220.0,
                currency="USD",
                source_count=15
            ),
            "electronics": PriceDataResult(
                min_price=600.0,
                max_price=1100.0,
                avg_price=850.0,
                currency="USD",
                source_count=25
            ),
            "vintage": PriceDataResult(
                min_price=75.0,
                max_price=200.0,
                avg_price=125.0,
                currency="USD",
                source_count=8
            ),
        }

        query_lower = query.lower()
        for category, prices in mock_prices.items():
            if category in query_lower:
                return prices

        return PriceDataResult(
            min_price=50.0,
            max_price=150.0,
            avg_price=100.0,
            currency="USD",
            source_count=5
        )


class AppraiserService:
    """
    Main service that orchestrates item appraisal.

    Combines vision identification with pricing data to produce
    a complete loot analysis.
    """

    def __init__(
        self,
        vision_service: VisionService | None = None,
        pricing_service: PricingService | None = None,
        gemini_api_key: str | None = None,
        serpapi_key: str | None = None,
    ):
        self.vision_service = vision_service or MockGeminiService(gemini_api_key)
        self.pricing_service = pricing_service or MockSerpApiService(serpapi_key)

    async def analyze_item(self, image_data: bytes) -> LootAnalysisResponse:
        """
        Full appraisal pipeline:
        1. Identify item using vision AI
        2. Look up market prices
        3. Calculate confidence and rarity
        4. Return unified response
        """
        vision_result = await self.vision_service.identify_item(image_data)

        search_query = self._build_search_query(vision_result)
        price_data = await self.pricing_service.get_price_data(search_query)

        return self._build_response(vision_result, price_data)

    def _build_search_query(self, vision_result: GeminiVisionResult) -> str:
        """Build a search query from vision results."""
        parts = []
        if vision_result.brand:
            parts.append(vision_result.brand)
        if vision_result.model:
            parts.append(vision_result.model)

        # If we have brand/model, that's a good query
        if parts:
            return " ".join(parts)

        # Otherwise, use the description for search
        if vision_result.raw_description:
            # Clean up description for search - take first sentence
            desc = vision_result.raw_description.strip()
            if ". " in desc:
                query = desc.split(". ")[0]
            else:
                query = desc[:80] if len(desc) > 80 else desc
            return query

        # Fall back to category
        if vision_result.category and vision_result.category != "Unknown":
            return vision_result.category

        return "unknown item"

    def _build_response(
        self,
        vision_result: GeminiVisionResult,
        price_data: PriceDataResult,
    ) -> LootAnalysisResponse:
        """Combine vision and pricing data into final response."""
        item_name = self._format_item_name(vision_result)
        estimated_value = self._format_price_range(price_data)
        confidence_score = self._calculate_confidence(vision_result, price_data)
        description = self._generate_description(vision_result)
        rarity_score = self._calculate_rarity(price_data)
        market_demand = self._calculate_market_demand(price_data)

        return LootAnalysisResponse(
            item_name=item_name,
            estimated_value=estimated_value,
            confidence_score=confidence_score,
            description=description,
            rarity_score=rarity_score,
            category=vision_result.category or "Unknown",
            market_demand=market_demand,
            source_count=price_data.source_count,
        )

    def _format_item_name(self, vision_result: GeminiVisionResult) -> str:
        """Format the item name from vision results."""
        parts = []
        if vision_result.brand:
            parts.append(vision_result.brand)
        if vision_result.model:
            parts.append(vision_result.model)

        if parts:
            return " ".join(parts)

        # Fall back to extracting name from description
        if vision_result.raw_description:
            # Use the first sentence or first 50 chars as the name
            desc = vision_result.raw_description.strip()
            if ". " in desc:
                name = desc.split(". ")[0]
            elif len(desc) > 50:
                name = desc[:50].rsplit(" ", 1)[0] + "..."
            else:
                name = desc
            return name

        # Last resort: use category
        if vision_result.category and vision_result.category != "Unknown":
            return vision_result.category + " Item"

        return "Unidentified Item"

    def _format_price_range(self, price_data: PriceDataResult) -> str:
        """Format price as display string with tight range or single value."""
        if price_data.avg_price is None:
            return "Price unavailable"

        avg = price_data.avg_price

        # If min and max are close (within 30%), show single value
        if price_data.min_price and price_data.max_price:
            spread = price_data.max_price - price_data.min_price
            if spread <= avg * 0.3:
                # Tight range - show as single estimated value
                return f"~${avg:.0f}"
            else:
                # Show range
                return f"${price_data.min_price:.0f} - ${price_data.max_price:.0f}"

        return f"~${avg:.0f}"

    def _calculate_confidence(
        self,
        vision_result: GeminiVisionResult,
        price_data: PriceDataResult,
    ) -> float:
        """
        Calculate confidence score based on data quality.

        Factors:
        - Completeness of vision identification
        - Number of price sources found
        """
        score = 0.5

        if vision_result.brand:
            score += 0.15
        if vision_result.model:
            score += 0.15
        if vision_result.condition:
            score += 0.05

        if price_data.source_count >= 10:
            score += 0.15
        elif price_data.source_count >= 5:
            score += 0.10

        return min(score, 1.0)

    def _generate_description(self, vision_result: GeminiVisionResult) -> str:
        """Generate a resale-friendly description."""
        parts = []

        if vision_result.raw_description:
            parts.append(vision_result.raw_description)

        if vision_result.condition:
            parts.append(f"Condition: {vision_result.condition}.")

        if vision_result.color:
            parts.append(f"Color: {vision_result.color}.")

        return " ".join(parts) if parts else "No description available."

    def _calculate_rarity(self, price_data: PriceDataResult) -> str:
        """
        Calculate rarity based on price and availability.

        Higher price + fewer sources = more rare
        """
        if price_data.avg_price is None:
            return "Unknown"

        avg = price_data.avg_price
        sources = price_data.source_count

        if avg > 500 and sources < 5:
            return "Legendary"
        elif avg > 300 or sources < 3:
            return "Epic"
        elif avg > 150 or sources < 8:
            return "Rare"
        elif avg > 75:
            return "Uncommon"
        else:
            return "Common"

    def _calculate_market_demand(self, price_data: PriceDataResult) -> str:
        """
        Calculate market demand based on number of sources.

        More sources = more listings = higher demand/activity
        """
        sources = price_data.source_count

        if sources >= 15:
            return "High"
        elif sources >= 5:
            return "Medium"
        else:
            return "Low"


def get_appraiser_service(
    gemini_api_key: str | None = None,
    serpapi_key: str | None = None,
) -> AppraiserService:
    """
    Factory function to create AppraiserService with proper dependencies.

    In production, pass actual API keys to use real services.
    Without keys, mock services are used.
    """
    from app.services.gemini_service import GeminiVisionService
    from app.services.serpapi_service import SerpApiPricingService

    vision_service = None
    pricing_service = None

    # Use real Gemini service if API key is provided
    if gemini_api_key:
        try:
            vision_service = GeminiVisionService(gemini_api_key)
            print("Using real Gemini Vision service")
        except Exception as e:
            print(f"Failed to initialize Gemini service: {e}, falling back to mock")

    # Use real SerpApi service if API key is provided
    if serpapi_key:
        try:
            pricing_service = SerpApiPricingService(serpapi_key)
            print("Using real SerpApi pricing service")
        except Exception as e:
            print(f"Failed to initialize SerpApi service: {e}, falling back to mock")

    return AppraiserService(
        vision_service=vision_service,
        pricing_service=pricing_service,
        gemini_api_key=gemini_api_key,
        serpapi_key=serpapi_key,
    )
