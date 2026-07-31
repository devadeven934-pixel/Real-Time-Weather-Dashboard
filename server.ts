import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google GenAI lazily or with fallbacks
function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API Endpoint 1: Generate AI Weather Briefing & Outfit Advice
app.post("/api/weather/ai-briefing", async (req, res) => {
  try {
    const { location, current, daily, airQuality } = req.body;
    if (!location || !current) {
      return res.status(400).json({ error: "Location and weather data are required" });
    }

    const ai = getGenAI();
    if (!ai) {
      // Fallback response if GEMINI_API_KEY is not set yet
      return res.json({
        summary: `Today in ${location.name}, expect temperatures around ${Math.round(current.temperature)}°C with ${current.cloudCover}% cloud cover and humidity at ${current.humidity}%.`,
        outfitRecommendation: current.temperature < 15 ? "A warm layer or jacket with comfortable footwear." : "Lightweight, breathable clothing.",
        bestOutdoorHours: "7:00 AM - 10:30 AM & 5:00 PM - 7:30 PM",
        activityScores: {
          running: current.temperature > 30 || current.temperature < 0 ? 55 : 88,
          cycling: current.windSpeed > 35 ? 45 : 82,
          stargazing: current.cloudCover > 60 ? 25 : 85,
          outdoorDining: current.temperature > 18 && current.cloudCover < 50 ? 90 : 60,
          photography: current.cloudCover > 20 && current.cloudCover < 70 ? 92 : 70,
        },
        commuteImpact: current.windSpeed > 40 ? "Windy conditions may cause slight delays." : "Road conditions are normal and clear.",
      });
    }

    const prompt = `Analyze this live weather telemetry for ${location.name}, ${location.country}:
- Temperature: ${current.temperature}°C (Feels like: ${current.apparentTemperature}°C)
- Weather Code: ${current.weatherCode}, Wind: ${current.windSpeed} km/h (Gusts: ${current.windGusts} km/h)
- Humidity: ${current.humidity}%, Pressure: ${current.pressure} hPa, UV Index: ${current.uvIndex}
- Air Quality AQI: ${airQuality?.aqi ?? 45} (${airQuality?.statusLabel ?? 'Good'})
- Today's Max Temp: ${daily?.[0]?.tempMax ?? current.temperature + 3}°C, Min Temp: ${daily?.[0]?.tempMin ?? current.temperature - 4}°C

Provide an insightful, executive weather analysis formatted as JSON containing:
1. "summary": A 2-sentence conversational, engaging weather briefing.
2. "outfitRecommendation": Practical clothing advice (e.g. jacket, breathable fabrics, umbrella, sunglasses).
3. "bestOutdoorHours": Optimal time window for outdoor activities today based on UV, temperature, and rain.
4. "activityScores": Object with numeric ratings (0-100) for "running", "cycling", "stargazing", "outdoorDining", "photography".
5. "commuteImpact": Brief commute and road visibility safety statement.
6. "travelWarning": Optional travel warning string if severe weather or high wind/AQI risks exist.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            outfitRecommendation: { type: Type.STRING },
            bestOutdoorHours: { type: Type.STRING },
            activityScores: {
              type: Type.OBJECT,
              properties: {
                running: { type: Type.NUMBER },
                cycling: { type: Type.NUMBER },
                stargazing: { type: Type.NUMBER },
                outdoorDining: { type: Type.NUMBER },
                photography: { type: Type.NUMBER },
              },
            },
            commuteImpact: { type: Type.STRING },
            travelWarning: { type: Type.STRING },
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json(parsed);
  } catch (error: any) {
    console.error("AI briefing generation error:", error);
    return res.status(500).json({
      error: "Failed to generate AI briefing",
      message: error.message,
    });
  }
});

// API Endpoint 2: Ask Weather AI Assistant
app.post("/api/weather/ask-assistant", async (req, res) => {
  try {
    const { question, location, current, daily } = req.body;
    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.json({
        answer: `Currently in ${location?.name || 'your area'}, the temperature is ${current?.temperature || 20}°C. For your question "${question}", weather conditions look suitable!`,
      });
    }

    const prompt = `You are an expert meteorological AI assistant integrated into a Real-Time Weather Dashboard.
Context for location ${location?.name}, ${location?.country}:
- Temperature: ${current?.temperature}°C
- Condition: Weather code ${current?.weatherCode}
- Humidity: ${current?.humidity}%, Wind: ${current?.windSpeed} km/h
- Today's range: High ${daily?.[0]?.tempMax}°C / Low ${daily?.[0]?.tempMin}°C

User question: "${question}"

Provide a concise, highly helpful, friendly response (max 3 short paragraphs). Be accurate, practical, and conversational.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
    });

    return res.json({ answer: response.text });
  } catch (error: any) {
    console.error("Ask AI assistant error:", error);
    return res.status(500).json({ error: "Failed to answer question", message: error.message });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
