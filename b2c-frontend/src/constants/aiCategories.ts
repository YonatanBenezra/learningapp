import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Brain,
  Cpu,
  Eye,
  Languages,
  Layers,
  Sparkles,
  Wand2,
} from 'lucide-react';

export const AI_CATEGORY_NAMES = [
  'Artificial Intelligence',
  'Machine Learning',
  'Deep Learning',
  'Data Science',
  'Natural Language Processing',
  'Computer Vision',
  'Generative AI',
  'Prompt Engineering',
] as const;

export type AiCategoryName = (typeof AI_CATEGORY_NAMES)[number];

export type AiCategoryOption = {
  name: AiCategoryName;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

export const AI_CATEGORY_OPTIONS: AiCategoryOption[] = [
  {
    name: 'Artificial Intelligence',
    icon: Brain,
    iconBg: 'bg-tint-lav',
    iconColor: 'text-[#7C3AED]',
  },
  {
    name: 'Machine Learning',
    icon: Cpu,
    iconBg: 'bg-tint-lav',
    iconColor: 'text-[#7C3AED]',
  },
  {
    name: 'Deep Learning',
    icon: Layers,
    iconBg: 'bg-tint-blue',
    iconColor: 'text-[#2563EB]',
  },
  {
    name: 'Data Science',
    icon: BarChart3,
    iconBg: 'bg-tint-peach',
    iconColor: 'text-secondary',
  },
  {
    name: 'Natural Language Processing',
    icon: Languages,
    iconBg: 'bg-primary-soft',
    iconColor: 'text-primary',
  },
  {
    name: 'Computer Vision',
    icon: Eye,
    iconBg: 'bg-tint-mint',
    iconColor: 'text-good',
  },
  {
    name: 'Generative AI',
    icon: Sparkles,
    iconBg: 'bg-tint-pink',
    iconColor: 'text-[#DB2777]',
  },
  {
    name: 'Prompt Engineering',
    icon: Wand2,
    iconBg: 'bg-tint-lime',
    iconColor: 'text-[#65A30D]',
  },
];

export const AI_CATEGORY_NAME_SET = new Set<string>(AI_CATEGORY_NAMES);

export function isAiCategory(value: string): value is AiCategoryName {
  return AI_CATEGORY_NAME_SET.has(value);
}

export const MARKETING_AI_CATEGORIES = AI_CATEGORY_OPTIONS.map(
  ({ name, icon, iconBg, iconColor }) => ({
    title: name,
    icon,
    iconBg,
    iconColor,
  }),
);
