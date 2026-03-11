import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || "";

export const generateImage = async (prompt: string, type: 'paper' | 'element', aspectRatio: "1:1" | "3:4" | "4:3" | "9:16" | "16:9" = "1:1") => {
  const ai = new GoogleGenAI({ apiKey });
  
  // Refine prompt based on type
  const refinedPrompt = type === 'paper' 
    ? `Seamless repeating pattern digital paper, ${prompt}, high resolution, flat design, aesthetic, professional scrapbooking style`
    : `Single isolated decorative element, sticker style, ${prompt}, white background, high resolution, die-cut look, professional scrapbooking element`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: {
        parts: [
          {
            text: refinedPrompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: "1K"
        }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned from Gemini");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};
