"""
Scan Router - Handles image upload and loot analysis endpoints.

Following the Service Layer Pattern:
- Router handles HTTP request/response only
- All business logic delegated to AppraiserService
"""

from fastapi import APIRouter, File, HTTPException, UploadFile, Depends, status

from app.schemas.loot import LootAnalysisResponse
from app.services.appraiser_service import AppraiserService, get_appraiser_service


router = APIRouter(prefix="/scan", tags=["scan"])

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp", "image/heic"}


def get_service() -> AppraiserService:
    """Dependency injection for AppraiserService with real API keys."""
    from app.config import get_settings
    settings = get_settings()
    return get_appraiser_service(
        gemini_api_key=settings.GEMINI_API_KEY,
        serpapi_key=settings.SERPAPI_KEY,
    )


@router.post(
    "/analyze",
    response_model=LootAnalysisResponse,
    status_code=status.HTTP_200_OK,
    summary="Analyze an item from image",
    description="Upload an image of an item to get its identification and estimated market value.",
)
async def analyze_item(
    image: UploadFile = File(..., description="Image file of the item to analyze"),
    service: AppraiserService = Depends(get_service),
) -> LootAnalysisResponse:
    """
    Analyze an uploaded image to identify the item and estimate its value.

    - **image**: JPEG, PNG, WebP, or HEIC image file (max 10MB)

    Returns item identification, price estimate, confidence score, and description.
    """
    if image.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {image.content_type}. "
                   f"Allowed types: {', '.join(ALLOWED_CONTENT_TYPES)}",
        )

    image_data = await image.read()

    if len(image_data) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {MAX_FILE_SIZE // (1024 * 1024)} MB.",
        )

    if len(image_data) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file uploaded.",
        )

    result = await service.analyze_item(image_data)

    return result


@router.get(
    "/health",
    status_code=status.HTTP_200_OK,
    summary="Health check for scan service",
)
async def health_check() -> dict[str, str]:
    """Check if the scan service is operational."""
    return {"status": "healthy", "service": "scan"}
