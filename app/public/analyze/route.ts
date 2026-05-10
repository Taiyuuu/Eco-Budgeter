import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  console.log("--- STARTING ANALYSIS ---");
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });

    const { data: profile } = await supabase.from("profiles").select("gemini_api_key").eq("id", user.id).single();
    const apiKey = profile?.gemini_api_key;

    const { image, storeName, totalAmount, description, items: providedItems } = await req.json();
    
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Gemini API Key missing. Please add it in Profile Settings." }), { status: 400 });
    }

    const google = createGoogleGenerativeAI({ apiKey });
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
              text: image 
                ? "Analyze this receipt. For each item, extract the name, total price, quantity, and a plasticRating (1-100, where 100 is eco-friendly). Also provide the storeName, totalAmount, a category (e.g. Groceries), isLocalBusiness (boolean), an overall ecoScore (1-100) based on the items, and an ecoTip."
                : `Analyze this manual expense. Store: ${storeName}, Total: ${totalAmount}, Description: ${description}, Items: ${JSON.stringify(providedItems)}. Calculate an eco-score (1-100), category, and eco-friendly tip based on the environmental impact of these purchases.`
            },
            ...(image ? [{ type: "image" as const, image }] : []),
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