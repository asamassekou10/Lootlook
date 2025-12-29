"""
Gemini Vision Service - AI-powered item identification.

Uses Google's Gemini 1.5 Flash model to analyze images and identify items
including brand, model, condition, and category.
"""

import base64
import json
import logging
from typing import Any

import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

from app.schemas.loot import GeminiVisionResult

logger = logging.getLogger(__name__)


IDENTIFICATION_PROMPT = """You are an expert appraiser and product identifier. Analyze this image and identify the item shown.

Your task is to identify:
1. **Brand**: The manufacturer or brand name (e.g., Nike, Apple, Sony)
2. **Model**: The specific model name/number (e.g., Air Jordan 1, iPhone 14 Pro)
3. **Condition**: Rate as one of: Mint, Excellent, Good, Fair, Poor
4. **Color**: Primary color(s) of the item
5. **Category**: One of: Sneakers, Electronics, Vintage, Collectibles, Clothing, Accessories, Toys, Books, Art, Furniture, Sports, Tools, Jewelry, Other

Respond ONLY with valid JSON in this exact format:
{
    "brand": "string or null",
    "model": "string or null",
    "condition": "string or null",
    "color": "string or null",
    "category": "string",
    "raw_description": "A brief 1-2 sentence description of the item for resale purposes"
}

If you cannot identify a field, use null. Always provide category and raw_description.
Focus on accuracy - only identify what you can clearly see."""


class GeminiVisionService:
    """Real Gemini Vision service for item identification."""

    def __init__(self, api_key: str):
        """Initialize with Gemini API key."""
        if not api_key:
            raise ValueError("Gemini API key is required")

        genai.configure(api_key=api_key)
        # Use the latest available Gemini model
        self.model = genai.GenerativeModel("models/gemini-2.0-flash")

        # Safety settings - allow most content for product identification
        self.safety_settings = {
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        }

    async def identify_item(self, image_data: bytes) -> GeminiVisionResult:
        """
        Identify an item from image data using Gemini Vision.

        Args:
            image_data: Raw bytes of the image file

        Returns:
            GeminiVisionResult with identification details
        """
        try:
            # Prepare image for Gemini
            image_part = {
                "mime_type": "image/jpeg",
                "data": base64.b64encode(image_data).decode("utf-8")
            }

            # Generate content with vision
            response = self.model.generate_content(
                [IDENTIFICATION_PROMPT, image_part],
                safety_settings=self.safety_settings,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.1,  # Low temperature for consistent results
                    max_output_tokens=500,
                )
            )

            # Parse response
            return self._parse_response(response.text)

        except Exception as e:
            logger.error(f"Gemini Vision API error: {e}")
            # Return empty result on error
            return GeminiVisionResult(
                category="Unknown",
                raw_description=f"Unable to identify item: {str(e)}"
            )

    def _parse_response(self, response_text: str) -> GeminiVisionResult:
        """Parse Gemini's JSON response into GeminiVisionResult."""
        try:
            # Clean up response - remove markdown code blocks if present
            cleaned = response_text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

            data: dict[str, Any] = json.loads(cleaned)

            return GeminiVisionResult(
                brand=data.get("brand"),
                model=data.get("model"),
                condition=data.get("condition"),
                color=data.get("color"),
                category=data.get("category", "Unknown"),
                raw_description=data.get("raw_description", "No description available"),
            )

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini response: {e}")
            logger.error(f"Raw response: {response_text}")

            # Try to extract what we can from the text
            return GeminiVisionResult(
                category="Unknown",
                raw_description=response_text[:200] if response_text else "Parse error"
            )
