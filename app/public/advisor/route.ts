import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY });

export async function POST(req: Request) {
  const { spendingData, budgetData } = await req.json();
  
  const result = await generateText({
    model: google("gemini-3.1-flash-lite-preview"),
    system: "You are a harsh but helpful financial advisor. Keep your response under 3 sentences. Focus on eco-friendly savings.",
    prompt: `Analyze this user's monthly data. Income: $${budgetData.monthly_income}, Fixed: $${budgetData.scheduled_expenses}, Goal: $${budgetData.saving_goal}. Here is their recent spending by category: ${JSON.stringify(spendingData)}. Give them one specific piece of advice to hit their savings goal while staying green.`,
  });

  return Response.json({ advice: result.text });
}