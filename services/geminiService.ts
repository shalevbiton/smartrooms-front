
import { GoogleGenAI, Type } from "@google/genai";
import { Room } from "../types";

export const parseBookingRequest = async (userPrompt: string, rooms: Room[]) => {
  // Fix: Initializing GoogleGenAI directly with process.env.API_KEY as per the library guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const roomsContext = rooms.map(r => ({
    id: r.id,
    name: r.name,
    capacity: r.capacity
  }));

  const systemInstruction = `
    You are an intelligent booking assistant for a meeting room system.
    Extract booking details from the user's prompt in Hebrew.
    Current Date: ${new Date().toLocaleDateString('en-CA')}
    
    Rules:
    - Return a JSON object.
    - If user says "מחר", calculate tomorrow's date.
    - Select the best roomId based on capacity or name.
    - Default startTime if missing: 09:00.
    - Default duration if missing: 1 hour.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Rooms: ${JSON.stringify(roomsContext)}. User Request: "${userPrompt}"`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            roomId: { type: Type.STRING },
            date: { type: Type.STRING },
            startTime: { type: Type.STRING },
            endTime: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["roomId", "date", "title"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("AI Error:", error);
    return null;
  }
};
