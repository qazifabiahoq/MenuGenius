
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, MenuCategory } from "../types";

// Initialize AI client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: {
      type: Type.OBJECT,
      properties: {
        efficiencyScore: { type: Type.NUMBER },
        totalOpportunity: { type: Type.NUMBER },
        recommendationCount: { type: Type.NUMBER },
        timeToImplement: { type: Type.STRING },
      },
      required: ["efficiencyScore", "totalOpportunity", "recommendationCount", "timeToImplement"],
    },
    matrixItems: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "The ACTUAL name of the dish as printed on the menu image." },
          category: { type: Type.STRING },
          categoryGroup: { type: Type.STRING, description: "The section of the menu it belongs to, e.g., 'Appetizers', 'Entrees', 'Desserts'." },
          salesVolume: { type: Type.NUMBER, description: "Normalized 0-100 score. If CSV is missing, estimate based on menu position and price." },
          profitMargin: { type: Type.NUMBER, description: "Normalized 0-100 score based on typical dish costs." },
          price: { type: Type.NUMBER },
          foodCost: { type: Type.NUMBER },
          marginPercent: { type: Type.NUMBER },
          quickRecommendation: { type: Type.STRING },
        },
        required: ["name", "category", "categoryGroup", "salesVolume", "profitMargin", "price", "foodCost", "marginPercent", "quickRecommendation"],
      },
    },
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          itemName: { type: Type.STRING },
          category: { type: Type.STRING },
          currentPrice: { type: Type.NUMBER },
          estimatedMargin: { type: Type.NUMBER },
          currentIssue: { type: Type.STRING },
          actions: { type: Type.ARRAY, items: { type: Type.STRING } },
          reasoningSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
          financialImpact: {
            type: Type.OBJECT,
            properties: {
              monthlyCurrent: { type: Type.NUMBER },
              monthlyProjected: { type: Type.NUMBER },
              annualCurrent: { type: Type.NUMBER },
              annualProjected: { type: Type.NUMBER },
              netBenefitAnnual: { type: Type.NUMBER },
            },
            required: ["monthlyCurrent", "monthlyProjected", "annualCurrent", "annualProjected", "netBenefitAnnual"],
          },
        },
        required: ["itemName", "category", "currentPrice", "estimatedMargin", "currentIssue", "actions", "reasoningSteps", "financialImpact"],
      },
    },
    descriptions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          itemName: { type: Type.STRING },
          before: { type: Type.STRING },
          after: { type: Type.STRING },
          psychologicalTriggers: { type: Type.ARRAY, items: { type: Type.STRING } },
          reasoning: { type: Type.STRING },
          impactPercent: { type: Type.NUMBER },
        },
        required: ["itemName", "before", "after", "psychologicalTriggers", "reasoning", "impactPercent"],
      },
    },
    pricingStrategy: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          issue: { type: Type.STRING },
          adjustment: { type: Type.STRING },
          reasoning: { type: Type.STRING },
          revenuePotential: { type: Type.NUMBER },
        },
        required: ["title", "issue", "adjustment", "reasoning", "revenuePotential"],
      },
    },
    finalImpact: {
      type: Type.OBJECT,
      properties: {
        annualIncrease: { type: Type.NUMBER },
        percentImprovement: { type: Type.NUMBER },
        roiTimeline: { type: Type.STRING },
        difficulty: { type: Type.STRING },
      },
      required: ["annualIncrease", "percentImprovement", "roiTimeline", "difficulty"],
    },
  },
  required: ["executiveSummary", "matrixItems", "recommendations", "descriptions", "pricingStrategy", "finalImpact"],
};

export async function analyzeMenu(menuImage?: string, salesCsv?: string): Promise<AnalysisResult> {
  const parts: any[] = [
    { text: `You are an elite restaurant consultant and menu engineer specializing in Menu Profitability and Performance.
    
    INPUT:
    1. A high-resolution image of a menu.
    2. (Optional) Sales data in CSV format.
    
    MANDATORY INSTRUCTIONS:
    - Perform a precise OCR extraction of item names and prices directly from the image.
    - If CSV data is provided, use it for precise sales volume and profit calculations.
    - IF CSV IS MISSING, you MUST perform a complete engineering analysis by ESTIMATING sales volumes based on menu cues (position, price relative to category) and industry benchmarks.
    - Categorize items into STAR, PLOWHORSE, PUZZLE, DOG (BCG Matrix).
    - Categorize items into section groups (e.g., 'Appetizers', 'Entrees', 'Desserts').
    
    Output strictly as JSON matching the schema. NEVER return a blank response.` }
  ];

  if (menuImage) {
    const [mimePart, dataPart] = menuImage.split(',');
    const mimeType = mimePart.match(/:(.*?);/)?.[1] || "image/jpeg";
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: dataPart
      }
    });
  }

  if (salesCsv) {
    parts.push({ text: `Actual Sales Data Provided: \n${salesCsv}` });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [{ role: "user", parts }],
    config: {
      responseMimeType: "application/json",
      responseSchema: ANALYSIS_SCHEMA as any,
    },
  });

  const jsonStr = response.text || "{}";
  console.log("Gemini Raw Response:", jsonStr);

  try {
    const result = JSON.parse(jsonStr.trim());
    // Basic validation to ensure required arrays exist
    if (!result.matrixItems) result.matrixItems = [];
    if (!result.recommendations) result.recommendations = [];
    if (!result.descriptions) result.descriptions = [];
    if (!result.pricingStrategy) result.pricingStrategy = [];
    
    return result as AnalysisResult;
  } catch (e) {
    console.error("Failed to parse AI response:", jsonStr, e);
    throw new Error("Invalid analysis generated. Please try a clearer image of your menu.");
  }
}

export const DEMO_DATA: AnalysisResult = {
  executiveSummary: {
    efficiencyScore: 78,
    totalOpportunity: 145000,
    recommendationCount: 5,
    timeToImplement: "2-3 Weeks"
  },
  matrixItems: [
    { name: "Wagyu Signature Burger", category: MenuCategory.STAR, categoryGroup: "Entrees", salesVolume: 95, profitMargin: 65, price: 24.50, foodCost: 8.50, marginPercent: 65, quickRecommendation: "Maintain high quality standards." },
    { name: "Classic Caesar Salad", category: MenuCategory.PUZZLE, categoryGroup: "Salads", salesVolume: 28, profitMargin: 82, price: 14.00, foodCost: 2.50, marginPercent: 82, quickRecommendation: "Increase menu visibility." },
    { name: "Penne Alla Vodka", category: MenuCategory.PLOWHORSE, categoryGroup: "Entrees", salesVolume: 88, profitMargin: 35, price: 16.00, foodCost: 10.40, marginPercent: 35, quickRecommendation: "Adjust price or reduce cost." },
    { name: "Hand-Cut Truffle Fries", category: MenuCategory.STAR, categoryGroup: "Appetizers", salesVolume: 92, profitMargin: 88, price: 12.00, foodCost: 1.40, marginPercent: 88, quickRecommendation: "Feature as a must-try side." },
    { name: "Wild Caught Salmon", category: MenuCategory.PUZZLE, categoryGroup: "Entrees", salesVolume: 32, profitMargin: 60, price: 28.00, foodCost: 11.20, marginPercent: 60, quickRecommendation: "Promote via table talkers." },
    { name: "Jumbo Buffalo Wings", category: MenuCategory.PLOWHORSE, categoryGroup: "Appetizers", salesVolume: 90, profitMargin: 40, price: 15.00, foodCost: 9.00, marginPercent: 40, quickRecommendation: "Bundle with high-margin drinks." },
    { name: "Beer Battered Onion Rings", category: MenuCategory.DOG, categoryGroup: "Appetizers", salesVolume: 12, profitMargin: 22, price: 9.00, foodCost: 7.00, marginPercent: 22, quickRecommendation: "Remove or replace with high-margin alternative." },
    { name: "Prime Filet Mignon", category: MenuCategory.STAR, categoryGroup: "Entrees", salesVolume: 70, profitMargin: 55, price: 48.00, foodCost: 21.60, marginPercent: 55, quickRecommendation: "Maintain as flagship item." },
    { name: "Garlic Knot Basket", category: MenuCategory.STAR, categoryGroup: "Appetizers", salesVolume: 98, profitMargin: 90, price: 6.00, foodCost: 0.60, marginPercent: 90, quickRecommendation: "Default table recommendation." },
    { name: "House Red Wine", category: MenuCategory.STAR, categoryGroup: "Beverages", salesVolume: 85, profitMargin: 75, price: 12.00, foodCost: 3.00, marginPercent: 75, quickRecommendation: "Suggest with every entree." },
    { name: "Calamari Fritti", category: MenuCategory.PLOWHORSE, categoryGroup: "Appetizers", salesVolume: 78, profitMargin: 30, price: 14.00, foodCost: 9.80, marginPercent: 30, quickRecommendation: "Evaluate portion sizing." },
    { name: "Molten Lava Cake", category: MenuCategory.PUZZLE, categoryGroup: "Desserts", salesVolume: 25, profitMargin: 70, price: 10.00, foodCost: 3.00, marginPercent: 70, quickRecommendation: "Upsell during entree service." }
  ],
  recommendations: [
    {
      itemName: "Classic Caesar Salad",
      category: MenuCategory.PUZZLE,
      currentPrice: 14.00,
      estimatedMargin: 82,
      currentIssue: "Strong profit margin of 82% but only 12 orders weekly despite prime menu placement.",
      actions: ["Reduce price to $12.50", "Add 'Chef's Choice' badge", "Rewrite description for sensory appeal"],
      reasoningSteps: [
        "Step 1: Current price of $14.00 is 18% above market average for Caesar salads in this segment.",
        "Step 2: Menu description lacks emotional appeal or sensory language required for higher conversion.",
        "Step 3: High-margin puzzles respond most effectively to volume-driving price adjustments.",
        "Step 4: Competitor analysis shows similar premium salads priced at $11.50-$12.75.",
        "Step 5: Small price reduction combined with improved positioning yields a projected 42% volume increase."
      ],
      financialImpact: {
        monthlyCurrent: 504,
        monthlyProjected: 715,
        annualCurrent: 6048,
        annualProjected: 8580,
        netBenefitAnnual: 2532
      }
    },
    {
      itemName: "Penne Alla Vodka",
      category: MenuCategory.PLOWHORSE,
      currentPrice: 16.00,
      estimatedMargin: 35,
      currentIssue: "High sales volume (88/mo) but margin is insufficient for primary revenue contribution.",
      actions: ["Increase price to $17.95 using charm pricing", "Reduce sauce portion by 1.5oz", "Introduce premium protein add-ons"],
      reasoningSteps: [
        "Step 1: Dairy index has risen 15% recently, eroding the pasta category's net margin.",
        "Step 2: High item loyalty suggests low price sensitivity among current customer base.",
        "Step 3: A migration to $17.95 retains the psychological price floor of sub-$20.",
        "Step 4: Slight portion engineering of high-cost cream reduces COGS by $0.45/plate.",
        "Step 5: Resulting margin improvement of $2.40 per unit with minimal volume loss."
      ],
      financialImpact: {
        monthlyCurrent: 1408,
        monthlyProjected: 1980,
        annualCurrent: 16896,
        annualProjected: 23760,
        netBenefitAnnual: 6864
      }
    }
  ],
  descriptions: [
    {
      itemName: "Wagyu Signature Burger",
      before: "8oz beef patty with cheese, lettuce, tomato, and onion on a brioche bun.",
      after: "Award-winning 28-day dry-aged Wagyu beef, seared to perfection. Layered with melted 2-year aged Vermont Cheddar, crisp heirloom tomatoes, and balsamic-glazed Vidalia onions on a toasted, buttery artisan brioche bun.",
      psychologicalTriggers: ["Origin Story", "Sensory Adjectives", "Social Proof", "Authenticity"],
      reasoning: "Switched functional language for 'power words' like 'Award-Winning' and 'Artisan'. Added specific origin details to justify premium price point.",
      impactPercent: 22
    }
  ],
  pricingStrategy: [
    {
      title: "Charm Pricing Migration",
      issue: "Current menu uses flat whole numbers (e.g., $16.00) for 60% of items.",
      adjustment: "Re-price all flat-tier items to ends in .95 or .99.",
      reasoning: "The 'left-digit effect' reduces perceived cost while retaining over 99% of raw revenue.",
      revenuePotential: 5200
    },
    {
      title: "Decoy Strategy Implementation",
      issue: "Missing a premium 'Anchor' item in the seafood category.",
      adjustment: "Introduce a 'Premium Seafood Platter' at $75.00.",
      reasoning: "Makes the $28.00 Salmon appear as a mid-tier value choice, driving conversion to high-margin mains.",
      revenuePotential: 8500
    }
  ],
  finalImpact: {
    annualIncrease: 145000,
    percentImprovement: 28,
    roiTimeline: "30 Days",
    difficulty: "Easy"
  }
};
