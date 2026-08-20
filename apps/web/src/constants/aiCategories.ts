import type { LucideIcon } from 'lucide-react';
import {
  AI_CATEGORY_NAME_SET,
  AI_CATEGORY_NAMES,
  isAiCategory,
  type AiCategoryName,
} from '@aieng/shared';
import {
  BarChart3,
  Bot,
  Brain,
  CircuitBoard,
  Cpu,
  Eye,
  Languages,
  Layers,
  MessageSquareText,
  ServerCog,
  ShieldCheck,
  Sparkles,
  Target,
  Wand2,
} from 'lucide-react';

export { AI_CATEGORY_NAMES, AI_CATEGORY_NAME_SET, isAiCategory, type AiCategoryName };

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
  {
    name: 'Large Language Models',
    icon: MessageSquareText,
    iconBg: 'bg-tint-blue',
    iconColor: 'text-[#0EA5E9]',
  },
  {
    name: 'AI Agents',
    icon: Bot,
    iconBg: 'bg-tint-peach',
    iconColor: 'text-[#EA580C]',
  },
  {
    name: 'MLOps',
    icon: ServerCog,
    iconBg: 'bg-tint-lav',
    iconColor: 'text-[#4F46E5]',
  },
  {
    name: 'Reinforcement Learning',
    icon: Target,
    iconBg: 'bg-tint-lime',
    iconColor: 'text-[#CA8A04]',
  },
  {
    name: 'Robotics',
    icon: CircuitBoard,
    iconBg: 'bg-tint-mint',
    iconColor: 'text-[#0D9488]',
  },
  {
    name: 'Responsible AI',
    icon: ShieldCheck,
    iconBg: 'bg-tint-pink',
    iconColor: 'text-[#E11D48]',
  },
];

export const MARKETING_AI_CATEGORIES = AI_CATEGORY_OPTIONS.map(
  ({ name, icon, iconBg, iconColor }) => ({
    title: name,
    icon,
    iconBg,
    iconColor,
  }),
);
