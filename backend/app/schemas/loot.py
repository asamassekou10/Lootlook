"""Pydantic schemas for Loot analysis."""

from pydantic import BaseModel, Field


class LootAnalysisResponse(BaseModel):
    """Response model for loot item analysis."""

    item_name: str = Field(
        ...,
        description="Identified name of the item (brand, model, etc.)",
        examples=["Nike Air Jordan 1 Retro High OG"]
    )
    estimated_value: str = Field(
        ...,
        description="Estimated market value range",
        examples=["$150 - $220"]
    )
    confidence_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Confidence level of the identification (0.0 to 1.0)",
        examples=[0.85]
    )
    description: str = Field(
        ...,
        description="Generated description suitable for resale listings",
        examples=["Classic high-top sneaker in excellent condition. Original colorway with minimal wear."]
    )
    rarity_score: str = Field(
        default="Common",
        description="Rarity classification of the item",
        examples=["Common", "Uncommon", "Rare", "Epic", "Legendary"]
    )
    category: str = Field(
        default="Unknown",
        description="Category of the identified item",
        examples=["Sneakers", "Electronics", "Vintage", "Collectibles"]
    )
    market_demand: str = Field(
        default="Medium",
        description="Market demand level for this item",
        examples=["High", "Medium", "Low"]
    )
    source_count: int = Field(
        default=0,
        description="Number of price sources found",
        examples=[15, 25, 8]
    )


class GeminiVisionResult(BaseModel):
    """Result from Gemini Vision API identification."""

    brand: str | None = None
    model: str | None = None
    condition: str | None = None
    color: str | None = None
    category: str | None = None
    raw_description: str | None = None


class PriceDataResult(BaseModel):
    """Result from SerpApi price lookup."""

    min_price: float | None = None
    max_price: float | None = None
    avg_price: float | None = None
    currency: str = "USD"
    source_count: int = 0
