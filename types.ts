
export enum MenuCategory {
  STAR = 'STAR',
  PLOWHORSE = 'PLOWHORSE',
  PUZZLE = 'PUZZLE',
  DOG = 'DOG'
}

export interface MatrixItem {
  name: string;
  category: MenuCategory;
  categoryGroup: string; // e.g., 'Appetizer', 'Entree', 'Dessert'
  salesVolume: number; // 0-100 normalized popularity
  profitMargin: number; // 0-100 normalized profitability
  price: number;
  foodCost: number;
  marginPercent: number; // Actual calculated margin %
  quickRecommendation: string;
}

export interface Recommendation {
  itemName: string;
  category: MenuCategory;
  currentPrice: number;
  estimatedMargin: number;
  currentIssue: string;
  actions: string[];
  reasoningSteps: string[];
  financialImpact: {
    monthlyCurrent: number;
    monthlyProjected: number;
    annualCurrent: number;
    annualProjected: number;
    netBenefitAnnual: number;
  };
}

export interface DescriptionOpt {
  itemName: string;
  before: string;
  after: string;
  psychologicalTriggers: string[];
  reasoning: string;
  impactPercent: number;
}

export interface PricingOpportunity {
  title: string;
  issue: string;
  adjustment: string;
  reasoning: string;
  revenuePotential: number;
}

export interface AnalysisResult {
  executiveSummary: {
    efficiencyScore: number;
    totalOpportunity: number;
    recommendationCount: number;
    timeToImplement: string;
  };
  matrixItems: MatrixItem[];
  recommendations: Recommendation[];
  descriptions: DescriptionOpt[];
  pricingStrategy: PricingOpportunity[];
  finalImpact: {
    annualIncrease: number;
    percentImprovement: number;
    roiTimeline: string;
    difficulty: 'Easy' | 'Moderate' | 'Complex';
  };
}
