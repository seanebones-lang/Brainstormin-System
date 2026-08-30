/**
 * Idea templates - preset prompts for common brainstorming scenarios
 * Users can select a template to quickly get started
 */

export interface IdeaTemplate {
  id: string;
  name: string;
  description: string;
  topic: string;
  style?: string;
  numIdeas?: number;
  category: string;
}

export const IDEA_TEMPLATES: IdeaTemplate[] = [
  // Product & Startup Ideas
  {
    id: 'saas-startup',
    name: 'SaaS Startup Ideas',
    description: 'Generate B2B SaaS business ideas with recurring revenue potential',
    topic: 'B2B SaaS startup ideas solving real business problems',
    style: 'practical, scalable, revenue-focused',
    numIdeas: 10,
    category: 'Product & Startup',
  },
  {
    id: 'mobile-app',
    name: 'Mobile App Concepts',
    description: 'Creative mobile app ideas for iOS and Android',
    topic: 'Innovative mobile app ideas that solve daily problems',
    style: 'user-friendly, viral potential, mobile-first',
    numIdeas: 10,
    category: 'Product & Startup',
  },
  {
    id: 'micro-saas',
    name: 'Micro-SaaS Ideas',
    description: 'Small, niche SaaS products manageable by solo founders',
    topic: 'Micro-SaaS ideas for solo founders with low maintenance',
    style: 'niche, low-code, profitable, solo-founder friendly',
    numIdeas: 10,
    category: 'Product & Startup',
  },
  {
    id: 'ai-tools',
    name: 'AI-Powered Tools',
    description: 'Tools and applications leveraging LLMs and AI',
    topic: 'AI-powered tools and applications for productivity and creativity',
    style: 'innovative, practical, leveraging latest AI capabilities',
    numIdeas: 10,
    category: 'Product & Startup',
  },

  // Marketing & Growth
  {
    id: 'content-marketing',
    name: 'Content Marketing Strategies',
    description: 'Creative content marketing ideas for audience growth',
    topic: 'Content marketing strategies for organic growth and engagement',
    style: 'actionable, measurable, platform-agnostic',
    numIdeas: 10,
    category: 'Marketing & Growth',
  },
  {
    id: 'viral-campaigns',
    name: 'Viral Marketing Campaigns',
    description: 'Campaign ideas designed for viral spread and brand awareness',
    topic: 'Viral marketing campaigns with high shareability',
    style: 'creative, emotional, shareable, low-budget',
    numIdeas: 10,
    category: 'Marketing & Growth',
  },
  {
    id: 'seo-strategies',
    name: 'SEO & Organic Growth',
    description: 'Search engine optimization strategies for sustainable traffic',
    topic: 'SEO strategies and content ideas for long-term organic growth',
    style: 'technical, evergreen, compound-growth focused',
    numIdeas: 10,
    category: 'Marketing & Growth',
  },

  // Productivity & Personal
  {
    id: 'productivity-systems',
    name: 'Productivity Systems',
    description: 'Personal productivity frameworks and tools',
    topic: 'Productivity systems and workflows for knowledge workers',
    style: 'practical, adaptable, low-friction',
    numIdeas: 10,
    category: 'Productivity & Personal',
  },
  {
    id: 'learning-education',
    name: 'Learning & Education Tools',
    description: 'Tools and methods for effective learning and skill acquisition',
    topic: 'Educational tools and learning methods for self-directed learners',
    style: 'engaging, evidence-based, personalized',
    numIdeas: 10,
    category: 'Productivity & Personal',
  },
  {
    id: 'habit-formation',
    name: 'Habit Formation & Behavior Change',
    description: 'Systems for building good habits and breaking bad ones',
    topic: 'Behavior change techniques and habit formation systems',
    style: 'scientific, sustainable, psychology-based',
    numIdeas: 10,
    category: 'Productivity & Personal',
  },

  // Creative & Innovation
  {
    id: 'creative-projects',
    name: 'Creative Project Ideas',
    description: 'Artistic and creative project inspiration',
    topic: 'Creative projects for artists, writers, and makers',
    style: 'inspiring, unique, expressive, skill-building',
    numIdeas: 10,
    category: 'Creative & Innovation',
  },
  {
    id: 'side-hustles',
    name: 'Side Hustle Ideas',
    description: 'Low-risk side income opportunities',
    topic: 'Side hustle ideas that can be started while working full-time',
    style: 'low-risk, flexible, scalable, skill-leveraging',
    numIdeas: 10,
    category: 'Creative & Innovation',
  },
  {
    id: 'innovation-workshop',
    name: 'Innovation Workshop Prompts',
    description: 'Structured prompts for team innovation sessions',
    topic: 'Innovation workshop exercises for cross-functional teams',
    style: 'collaborative, structured, outcome-oriented',
    numIdeas: 10,
    category: 'Creative & Innovation',
  },

  // Technology & Engineering
  {
    id: 'dev-tools',
    name: 'Developer Tools',
    description: 'Tools and utilities that improve developer experience',
    topic: 'Developer tools and productivity enhancements for software engineers',
    style: 'technical, open-source friendly, workflow-improving',
    numIdeas: 10,
    category: 'Technology & Engineering',
  },
  {
    id: 'automation-ideas',
    name: 'Automation & Scripts',
    description: 'Automation ideas for repetitive tasks and workflows',
    topic: 'Automation scripts and workflows for knowledge work',
    style: 'practical, time-saving, no-code/low-code friendly',
    numIdeas: 10,
    category: 'Technology & Engineering',
  },
  {
    id: 'tech-debt-solutions',
    name: 'Technical Debt Solutions',
    description: 'Approaches for managing and reducing technical debt',
    topic: 'Strategies and tools for technical debt management',
    style: 'systematic, measurable, team-friendly',
    numIdeas: 10,
    category: 'Technology & Engineering',
  },

  // Social Impact
  {
    id: 'social-impact',
    name: 'Social Impact Projects',
    description: 'Ideas for projects that create positive social change',
    topic: 'Social impact projects and non-profit initiatives',
    style: 'mission-driven, sustainable, community-focused',
    numIdeas: 10,
    category: 'Social Impact',
  },
  {
    id: 'sustainability',
    name: 'Sustainability & Green Tech',
    description: 'Environmental sustainability and green technology ideas',
    topic: 'Sustainability innovations and eco-friendly solutions',
    style: 'environmental, scalable, measurable impact',
    numIdeas: 10,
    category: 'Social Impact',
  },
  {
    id: 'accessibility',
    name: 'Accessibility & Inclusion',
    description: 'Making products and services more accessible',
    topic: 'Accessibility improvements and inclusive design solutions',
    style: 'inclusive, compliant, user-centered',
    numIdeas: 10,
    category: 'Social Impact',
  },
];

export function getTemplatesByCategory(category: string): IdeaTemplate[] {
  return IDEA_TEMPLATES.filter(t => t.category === category);
}

export function getAllCategories(): string[] {
  return [...new Set(IDEA_TEMPLATES.map(t => t.category))].sort();
}

export function getTemplateById(id: string): IdeaTemplate | undefined {
  return IDEA_TEMPLATES.find(t => t.id === id);
}