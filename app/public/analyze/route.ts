import { google } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

export async function POST(req: Request) {
  console.log("--- STARTING ANALYSIS ---");
  try {
    const { image } = await req.json();
    
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      console.error("CRITICAL: GOOGLE_GENERATIVE_AI_API_KEY is missing!");
      return new Response(JSON.stringify({ error: "API Key missing" }), { status: 500 });
    }

    // This is the line that usually crashes
    const result = await generateObject({
      model: google("gemini-3.1-flash-lite-preview"), // or your working version
      schema: z.object({
        storeName: z.string(),
        totalAmount: z.number(),
        category: z.string(),
        isLocalBusiness: z.boolean(),
        ecoScore: z.number(),
        items: z.array(z.object({
          name: z.string(),
          price: z.number(),         // Price for the total amount of this item
          quantity: z.number(),      // NEW: Extract the quantity (e.g., 3)
          plasticRating: z.number(),
        })),
        ecoTip: z.string(),
      }),
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Analyze this receipt. For each item, extract the name, total price, quantity, and a plasticRating (1-100, where 100 is eco-friendly). Also provide the storeName, totalAmount, a category (e.g. Groceries), isLocalBusiness (boolean), an overall ecoScore (1-100) based on the items, and an ecoTip." 
            },
            { type: "image", image },
          ],
        },
      ],
    });

    console.log("--- ANALYSIS SUCCESS ---", new Date().toISOString());
    console.log(result.object);
    return Response.json(result.object);

  } catch (error: any) {
    console.error("FULL ERROR LOG:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}