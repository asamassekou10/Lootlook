import { LootAnalysisResponse } from "../types/loot";

// Update this to your computer's local IP address for phone testing
const DEV_MACHINE_IP = "10.0.0.96";

const API_BASE_URL = __DEV__
  ? `http://${DEV_MACHINE_IP}:8000/api/v1`
  : "https://api.lootlook.app/api/v1";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function analyzeImage(
  imageUri: string
): Promise<LootAnalysisResponse> {
  const formData = new FormData();

  const filename = imageUri.split("/").pop() || "image.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : "image/jpeg";

  formData.append("image", {
    uri: imageUri,
    name: filename,
    type,
  } as any);

  const response = await fetch(`${API_BASE_URL}/scan/analyze`, {
    method: "POST",
    body: formData,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      response.status,
      errorData.detail || `Request failed with status ${response.status}`
    );
  }

  return response.json();
}

export async function checkHealth(): Promise<{ status: string }> {
  const response = await fetch(`${API_BASE_URL}/scan/health`);

  if (!response.ok) {
    throw new ApiError(response.status, "Health check failed");
  }

  return response.json();
}

export { ApiError };
