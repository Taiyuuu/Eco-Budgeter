//AI assisted code
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

    const body = await req.json();
    const { type, image, storeName, totalAmount, description, items: providedItems, history, budgetInfo } = body;
    
    if (!apiKey) {
      return Response.json({ error: "Gemini API Key missing. Please add it in Profile Settings." }, { status: 400 });
    }

    const google = createGoogleGenerativeAI({ apiKey });

    // Handle Financial Spending Analysis
    if (type === "spending_summary") {
      const result = await generateObject({
        model: google("gemini-3.1-flash-lite-preview"),
        schema: z.object({
          status: z.string(),
          summary: z.string(),
          recommendations: z.array(z.string()),
          savingPotential: z.string(),
        }),
        messages: [
          {
            role: "user",
            content: `Analyze the following user spending history and budget data. 
            Budget Info: ${JSON.stringify(budgetInfo)}
            History: ${JSON.stringify(history)}
            Provide a one-word financial status (e.g., "Healthy", "Overspending", "Stable", "At Risk"), a summary of their spending patterns, 3 actionable financial recommendations, and an estimate of their monthly saving potential based on their habits.`
          }
        ]
      });

      // Save to profile
      await supabase.from("profiles").update({
        last_analysis_date: new Date().toISOString(),
        last_analysis_text: JSON.stringify(result.object)
      }).eq("id", user.id);

      return Response.json(result.object);
    }

    const result = await generateObject({
      model: google("gemini-3.1-flash-lite-preview"),
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
                ? "Analyze this receipt. For each item, extract the name, total price, quantity, and a plasticRating (1-100, where 100 is zero-waste/organic). Provide the storeName, totalAmount, a category, isLocalBusiness (boolean), and an overall ecoScore (1-100). Use the full range: 80+ for local/organic/bulk, 40-60 for mixed, <30 for high-plastic/fast-food/corporate chains. Also include a helpful ecoTip."
                : `Analyze this manual expense. Store: ${storeName}, Total: ${totalAmount}, Description: ${description}, Items: ${JSON.stringify(providedItems)}. Calculate an eco-score (1-100) using the full scale: 100 is perfectly sustainable, 50 is neutral, 1 is extremely high waste. Consider the store's reputation and the items listed. Also provide a category and a specific eco-friendly tip.`
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
    return Response.json({ error: error.message }, { status: 500 });
  }
}
