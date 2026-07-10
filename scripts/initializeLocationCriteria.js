// Simple script to initialize location criteria
const API_BASE = "http://192.168.100.15:4000/api";

async function initializeLocationCriteria() {
  try {
    console.log("Initializing location criteria...");

    const response = await fetch(`${API_BASE}/location-discovery/initialize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result = await response.json();

    if (result.success) {
      console.log("✅ Location criteria initialized successfully!");
      console.log("Result:", result);
    } else {
      console.error("❌ Failed to initialize location criteria:", result);
    }
  } catch (error) {
    console.error("❌ Error initializing location criteria:", error);
  }
}

// Run the initialization
initializeLocationCriteria();
