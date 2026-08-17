import type { MessageKey } from '@/src/i18n/locale';
import { useTranslation } from '@/src/i18n';
import { TRIAL_PERIOD_MONTHS } from '@/src/constants/pricing';
import type { SkillLevel } from '@/src/domain/assessment';
import type { CourseStatus } from '@/src/domain/course';
import type { LearningGoal } from '@/src/features/learning-path/learningPathRecommendation';

const CATEGORY_KEYS: Record<string, MessageKey> = {
  'Artificial Intelligence': 'marketing.catArtificialIntelligence',
  'Machine Learning': 'marketing.catMachineLearning',
  'Deep Learning': 'marketing.catDeepLearning',
  'Data Science': 'marketing.catDataScience',
  'Natural Language Processing': 'marketing.catNaturalLanguageProcessing',
  'Computer Vision': 'marketing.catComputerVision',
  'Generative AI': 'marketing.catGenerativeAI',
  'Prompt Engineering': 'marketing.catPromptEngineering',
  'Large Language Models': 'marketing.catLargeLanguageModels',
  'AI Agents': 'marketing.catAiAgents',
  MLOps: 'marketing.catMlops',
  'Reinforcement Learning': 'marketing.catReinforcementLearning',
  Robotics: 'marketing.catRobotics',
  'Responsible AI': 'marketing.catResponsibleAi',
  Programming: 'marketing.catProgramming',
  Coding: 'marketing.catProgramming',
  'Cyber Security': 'marketing.catCyberSecurity',
  Cybersecurity: 'marketing.catCyberSecurity',
  Networking: 'marketing.catNetworking',
  Security: 'marketing.catSecurity',
  General: 'marketing.catGeneral',
};

const TOPIC_KEYS: Record<string, MessageKey> = CATEGORY_KEYS;

export function categoryLabelFor(t: (key: MessageKey) => string, englishTitle: string) {
  const key = CATEGORY_KEYS[englishTitle];
  return key ? t(key) : englishTitle;
}

export function useCategoryLabel(englishTitle: string) {
  const { t } = useTranslation();
  return categoryLabelFor(t, englishTitle);
}

export function useTopicLabel(topic: string) {
  const { t } = useTranslation();
  const key = TOPIC_KEYS[topic];
  return key ? t(key) : topic;
}

export function useMarketingNavLinks() {
  const { t } = useTranslation();
  return [
    { label: t('nav.courses'), href: '/courses' },
    { label: t('nav.assessments'), href: '/assessments' },
    { label: t('nav.pricing'), href: '/pricing' },
    { label: t('nav.contact'), href: '/contact' },
  ] as const;
}

export function useFormatCourseCount() {
  const { t } = useTranslation();
  return (count: number | undefined) => {
    if (count === undefined) return t('marketing.courseCountLoading');
    if (count === 0) return t('marketing.courseCountNone');
    if (count === 1) return t('marketing.courseCountOne');
    return t('marketing.courseCountMany', { count: String(count) });
  };
}

export function useAssessmentGoals() {
  const { t } = useTranslation();
  return [
    { value: 'career' as const, title: t('marketing.goalCareerTitle'), desc: t('marketing.goalCareerDesc') },
    { value: 'hands_on' as const, title: t('marketing.goalHandsOnTitle'), desc: t('marketing.goalHandsOnDesc') },
    { value: 'certification' as const, title: t('marketing.goalCertTitle'), desc: t('marketing.goalCertDesc') },
    { value: 'exploring' as const, title: t('marketing.goalExploreTitle'), desc: t('marketing.goalExploreDesc') },
  ];
}

export function usePricingPlans() {
  const { t } = useTranslation();
  const months = String(TRIAL_PERIOD_MONTHS);

  return [
    {
      id: 'free' as const,
      name: t('marketing.planFree'),
      subtitle: t('marketing.planFreeSubtitle'),
      price: 0,
      period: t('marketing.periodTrial'),
      features: [
        t('marketing.freeFeature1'),
        t('marketing.freeFeature2'),
        t('marketing.freeFeature3'),
        t('marketing.freeFeature4'),
        t('marketing.freeFeature5'),
        t('marketing.freeFeature6'),
        t('marketing.freeFeature7'),
      ],
    },
    {
      id: 'standard' as const,
      name: t('marketing.planStandard'),
      subtitle: t('marketing.planStandardSubtitle'),
      price: 34,
      period: t('marketing.periodMonth'),
      featured: true,
      features: [
        t('marketing.standardFeature1', { months }),
        t('marketing.standardFeature2'),
        t('marketing.standardFeature3'),
        t('marketing.standardFeature4'),
        t('marketing.standardFeature5'),
        t('marketing.standardFeature6'),
        t('marketing.standardFeature7'),
        t('marketing.standardFeature8'),
      ],
    },
    {
      id: 'premium' as const,
      name: t('marketing.planPremium'),
      subtitle: t('marketing.planPremiumSubtitle'),
      price: 150,
      period: t('marketing.periodMonth'),
      features: [
        t('marketing.premiumFeature1'),
        t('marketing.premiumFeature2'),
        t('marketing.premiumFeature3'),
        t('marketing.premiumFeature4'),
        t('marketing.premiumFeature5'),
        t('marketing.premiumFeature6'),
        t('marketing.premiumFeature7'),
      ],
    },
  ];
}

export function usePlanComparisonRows() {
  const { t } = useTranslation();
  return [
    {
      feature: t('marketing.cmpPlatformAccess'),
      free: t('marketing.cmpFreeTrial'),
      standard: t('marketing.cmpPaidStandard'),
      premium: t('marketing.cmpPaidPremium'),
    },
    {
      feature: t('marketing.cmpSkillAssessments'),
      free: t('marketing.cmpFive'),
      standard: t('marketing.cmpTwenty'),
      premium: t('marketing.cmpUnlimited'),
    },
    {
      feature: t('marketing.cmpActiveCourses'),
      free: t('marketing.cmpFive'),
      standard: t('marketing.cmpTwenty'),
      premium: t('marketing.cmpUnlimited'),
    },
    {
      feature: t('marketing.cmpQuizzesMonth'),
      free: t('marketing.cmpTwenty'),
      standard: t('marketing.cmpFifty'),
      premium: t('marketing.cmpUnlimited'),
    },
    {
      feature: t('marketing.cmpExamsMonth'),
      free: t('marketing.cmpTwenty'),
      standard: t('marketing.cmpFifty'),
      premium: t('marketing.cmpUnlimited'),
    },
    {
      feature: t('marketing.cmpPracticeDay'),
      free: t('marketing.cmpTwenty'),
      standard: t('marketing.cmpFifty'),
      premium: t('marketing.cmpUnlimited'),
    },
    {
      feature: t('marketing.cmpPriorityQueue'),
      free: t('marketing.dash'),
      standard: t('marketing.dash'),
      premium: t('marketing.yes'),
    },
    {
      feature: t('marketing.cmpAdvancedLabs'),
      free: t('marketing.dash'),
      standard: t('marketing.dash'),
      premium: t('marketing.yes'),
    },
  ];
}

export function usePricingFaqItems() {
  const { t } = useTranslation();
  return [
    { q: t('marketing.faqTrialQ'), a: t('marketing.faqTrialA') },
    { q: t('marketing.faqAfterTrialQ'), a: t('marketing.faqAfterTrialA') },
    { q: t('marketing.faqDiffQ'), a: t('marketing.faqDiffA') },
    { q: t('marketing.faqPremiumTrialQ'), a: t('marketing.faqPremiumTrialA') },
    { q: t('marketing.faqCancelQ'), a: t('marketing.faqCancelA') },
  ];
}

export function useLocaleDateFormatter() {
  const { locale } = useTranslation();
  return (value: string) =>
    new Intl.DateTimeFormat(
      locale === 'he'
        ? 'he-IL'
        : locale === 'bn'
          ? 'bn-BD'
          : locale === 'de'
            ? 'de-DE'
            : locale === 'zh'
              ? 'zh-CN'
              : locale === 'es'
                ? 'es-ES'
                : locale === 'ar'
                  ? 'ar-SA'
                  : locale === 'hi'
                    ? 'hi-IN'
                  : locale === 'fr'
                    ? 'fr-FR'
                    : locale === 'ja'
                      ? 'ja-JP'
                      : 'en',
      {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(value));
}

export function useIsRtl() {
  const { locale } = useTranslation();
  return locale === 'he' || locale === 'ar';
}

const LEVEL_KEYS: Record<
  SkillLevel,
  { name: MessageKey; desc: MessageKey; track: MessageKey }
> = {
  Beginner: {
    name: 'marketing.levelBeginner',
    desc: 'marketing.levelBeginnerDesc',
    track: 'marketing.trackFoundation',
  },
  Intermediate: {
    name: 'marketing.levelIntermediate',
    desc: 'marketing.levelIntermediateDesc',
    track: 'marketing.trackGrowth',
  },
  Advanced: {
    name: 'marketing.levelAdvanced',
    desc: 'marketing.levelAdvancedDesc',
    track: 'marketing.trackAdvanced',
  },
  Expert: {
    name: 'marketing.levelExpert',
    desc: 'marketing.levelExpertDesc',
    track: 'marketing.trackExpert',
  },
};

export function useSkillLevelCopy(level: SkillLevel) {
  const { t } = useTranslation();
  const keys = LEVEL_KEYS[level];
  return {
    level: t(keys.name),
    description: t(keys.desc),
    track: t(keys.track),
  };
}

export function useAssessmentTopicLabel(topic: string, customTopic: string | null) {
  const { t } = useTranslation();
  if (customTopic?.trim()) return customTopic.trim();
  const key = TOPIC_KEYS[topic];
  return key ? t(key) : topic;
}

const GOAL_KEY_MAP: Record<LearningGoal, MessageKey> = {
  career: 'marketing.goalCareerTitle',
  hands_on: 'marketing.goalHandsOnTitle',
  certification: 'marketing.goalCertTitle',
  exploring: 'marketing.goalExploreTitle',
};

export function useGoalLabel(goal: LearningGoal | null | undefined) {
  const { t } = useTranslation();
  if (!goal) return null;
  return t(GOAL_KEY_MAP[goal]);
}

export function useCourseLevelLabel(level: 'beginner' | 'intermediate' | 'advanced') {
  const { t } = useTranslation();
  const map = {
    beginner: 'marketing.levelBeginner',
    intermediate: 'marketing.levelIntermediate',
    advanced: 'marketing.levelAdvanced',
  } as const satisfies Record<'beginner' | 'intermediate' | 'advanced', MessageKey>;
  return t(map[level]);
}

export function useGenerationPhases() {
  const { t } = useTranslation();
  return [
    t('marketing.assessGenPhase1'),
    t('marketing.assessGenPhase2'),
    t('marketing.assessGenPhase3'),
    t('marketing.assessGenPhase4'),
  ];
}

export function useCourseStatusLabel(status: CourseStatus) {
  const { t } = useTranslation();
  const map = {
    generating: 'courses.statusGenerating',
    ready: 'courses.statusReady',
    failed: 'courses.statusFailed',
    completed: 'courses.statusCompleted',
    archived: 'courses.statusArchived',
  } as const satisfies Record<CourseStatus, MessageKey>;
  return t(map[status]);
}

const CREATE_SUBJECT_KEYS: Record<string, MessageKey> = CATEGORY_KEYS;

export function useCreateCourseSubjectLabel(name: string) {
  const { t } = useTranslation();
  const key = CREATE_SUBJECT_KEYS[name];
  return key ? t(key) : name;
}

export function useCreateCourseSteps() {
  const { t } = useTranslation();
  return [
    { id: 1 as const, label: t('createCourse.step1Label'), hint: t('createCourse.step1Hint') },
    { id: 2 as const, label: t('createCourse.step2Label'), hint: t('createCourse.step2Hint') },
    { id: 3 as const, label: t('createCourse.step3Label'), hint: t('createCourse.step3Hint') },
  ];
}

export function useCreateCourseLevels() {
  const { t } = useTranslation();
  return [
    {
      value: 'beginner' as const,
      title: t('createCourse.levelBeginner'),
      desc: t('createCourse.levelBeginnerDesc'),
      badge: t('createCourse.levelBeginnerBadge'),
    },
    {
      value: 'intermediate' as const,
      title: t('createCourse.levelIntermediate'),
      desc: t('createCourse.levelIntermediateDesc'),
      badge: t('createCourse.levelIntermediateBadge'),
    },
    {
      value: 'advanced' as const,
      title: t('createCourse.levelAdvanced'),
      desc: t('createCourse.levelAdvancedDesc'),
      badge: t('createCourse.levelAdvancedBadge'),
    },
  ];
}

export function useCreateCoursePhases() {
  const { t } = useTranslation();
  return [
    { label: t('createCourse.genPhase1'), detail: t('createCourse.genPhase1Desc') },
    { label: t('createCourse.genPhase2'), detail: t('createCourse.genPhase2Desc') },
    { label: t('createCourse.genPhase3'), detail: t('createCourse.genPhase3Desc') },
    { label: t('createCourse.genPhase4'), detail: t('createCourse.genPhase4Desc') },
  ];
}

export function useAboutPoints() {
  const { t } = useTranslation();
  return [
    { bold: t('marketing.aboutPoint1'), normal: t('marketing.aboutPoint2') },
    { bold: t('marketing.aboutPoint3'), normal: t('marketing.aboutPoint4') },
    { bold: t('marketing.aboutPoint5'), normal: t('marketing.aboutPoint6') },
  ];
}

export function useMarketingFaqItems() {
  const { t } = useTranslation();
  return [
    { q: t('marketing.faq1Q'), a: t('marketing.faq1A') },
    { q: t('marketing.faq2Q'), a: t('marketing.faq2A') },
    { q: t('marketing.faq3Q'), a: t('marketing.faq3A') },
    { q: t('marketing.faq4Q'), a: t('marketing.faq4A') },
    { q: t('marketing.faq5Q'), a: t('marketing.faq5A') },
  ];
}

export function useWhyChooseCards() {
  const { t } = useTranslation();
  return [
    { title: t('marketing.whyCard1Title'), body: t('marketing.whyCard1Body') },
    { title: t('marketing.whyCard2Title'), body: t('marketing.whyCard2Body') },
    { title: t('marketing.whyCard3Title'), body: t('marketing.whyCard3Body') },
  ];
}

export function useMarketingStats() {
  const { t } = useTranslation();
  return [
    { value: '10', suffix: 'K+', label: t('marketing.statStudents') },
    { value: '10', suffix: 'K+', label: t('marketing.statCourses') },
    { value: '10', suffix: 'M+', label: t('marketing.statReviews') },
    { value: '10', suffix: 'K+', label: t('marketing.statStudents') },
  ] as const;
}

export type PopularCourseFilter =
  | 'All Categories'
  | 'Artificial Intelligence'
  | 'Machine Learning'
  | 'Generative AI'
  | 'Data Science';

export function usePopularCoursesFilters() {
  const { t } = useTranslation();
  return [
    { value: 'All Categories' as const, label: t('marketing.allCategories') },
    { value: 'Artificial Intelligence' as const, label: t('marketing.catArtificialIntelligence') },
    { value: 'Machine Learning' as const, label: t('marketing.catMachineLearning') },
    { value: 'Generative AI' as const, label: t('marketing.catGenerativeAI') },
    { value: 'Data Science' as const, label: t('marketing.catDataScience') },
  ];
}

export function useMarketingCourseLevelLabel(level: string) {
  const { t } = useTranslation();
  const map: Record<string, MessageKey> = {
    Beginner: 'marketing.levelBeginner',
    Advance: 'marketing.levelAdvance',
    'Entry Level': 'marketing.levelEntry',
    Medium: 'marketing.levelMedium',
  };
  const key = map[level];
  return key ? t(key) : level;
}

export function useClassDays() {
  const { t } = useTranslation();
  const time = t('marketing.classTime');
  return [
    { day: t('marketing.weekdaySaturday'), time },
    { day: t('marketing.weekdaySunday'), time },
    { day: t('marketing.weekdayMonday'), time },
    { day: t('marketing.weekdayTuesday'), time },
    { day: t('marketing.weekdayWednesday'), time },
  ];
}

const INSTRUCTOR_ROLE_KEYS = [
  'roleGraphicsDesigner',
  'roleProductDesigner',
  'roleWebDesigner',
  'roleProductDesigner',
] as const;

export function useInstructorsWithRoles(
  instructors: readonly { name: string; role: string; image: string }[],
) {
  const { t } = useTranslation();
  return instructors.map((instructor, index) => ({
    ...instructor,
    role: t(`marketing.${INSTRUCTOR_ROLE_KEYS[index] ?? 'roleTechSpecialist'}`),
  }));
}

export function useMarketingSocialLabels() {
  const { t } = useTranslation();
  return {
    facebook: t('marketing.socialFacebook'),
    twitter: t('marketing.socialTwitter'),
    instagram: t('marketing.socialInstagram'),
    linkedIn: t('marketing.socialLinkedIn'),
  };
}

export function useMarketingTerminalDemo() {
  const { t } = useTranslation();
  return {
    command: t('marketing.terminalCommand'),
    output: [t('marketing.terminalOutput1'), t('marketing.terminalOutput2')],
    label: t('marketing.terminalLabel'),
  };
}
