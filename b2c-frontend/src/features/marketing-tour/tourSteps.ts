import type { DriveStep } from 'driver.js';

const WELCOME_STEP: DriveStep = {
  popover: {
    title: 'Welcome to AIStudy',
    description:
      'This one-time tour highlights the main areas of the platform — courses, assessments, pricing, and how to get help.',
  },
};

const NAV_ROUTE_STEPS: DriveStep[] = [
  {
    element: '[data-tour="tour-nav-home"]',
    popover: {
      title: 'Home',
      description:
        'Return to the landing page for the hero, learning domains, categories, and FAQs.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="tour-nav-courses"]',
    popover: {
      title: 'Courses',
      description:
        'Open the course catalog to browse marketplace courses and filter by domain or level.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="tour-nav-assessments"]',
    popover: {
      title: 'Assessments',
      description:
        'Take skill assessments to discover your level and unlock personalized learning paths.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="tour-nav-pricing"]',
    popover: {
      title: 'Pricing',
      description:
        'Compare Free, Standard, and Premium plans and see what each tier includes.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="tour-nav-contact"]',
    popover: {
      title: 'Contact',
      description:
        'Reach our team for support, billing questions, partnerships, or general enquiries.',
      side: 'bottom',
      align: 'end',
    },
  },
];

const ASK_BINA_STEP: DriveStep = {
  element: '[data-tour="tour-ask-bina"]',
  popover: {
    title: 'Ask Bina',
    description:
      'Open the assistant anytime to ask about pricing, AI courses, skill assessments, labs, or how to get started.',
    side: 'top',
    align: 'end',
  },
};

const HOME_TOUR_STEPS: DriveStep[] = [
  WELCOME_STEP,
  ...NAV_ROUTE_STEPS,
  {
    element: '[data-tour="tour-hero"]',
    popover: {
      title: 'Your learning hub',
      description:
        'AIStudy combines AI-generated courses, hands-on labs, quizzes, and exams in one workspace.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="tour-hero-actions"]',
    popover: {
      title: 'Get started quickly',
      description:
        'Create a free account or take a skill assessment to get a personalized learning path.',
      side: 'top',
      align: 'start',
    },
  },
  {
    element: '[data-tour="tour-categories"]',
    popover: {
      title: 'Browse by domain',
      description:
        'Explore programming, AI, cyber security, networking, and more — each category links to the course catalog.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '[data-tour="tour-faq"]',
    popover: {
      title: 'Common questions',
      description:
        'Learn how AI courses are built, what labs include, and how the free trial works.',
      side: 'top',
      align: 'center',
    },
  },
  ASK_BINA_STEP,
];

const COURSES_TOUR_STEPS: DriveStep[] = [
  WELCOME_STEP,
  ...NAV_ROUTE_STEPS,
  {
    element: '[data-tour="tour-course-catalog"]',
    popover: {
      title: 'Course catalog',
      description:
        'Browse published marketplace courses. Search by title, topic, or level to find what you need.',
      side: 'bottom',
      align: 'start',
    },
  },
  {
    element: '[data-tour="tour-course-filters"]',
    popover: {
      title: 'Filter by category',
      description:
        'Switch between domains like Programming, AI, and Cyber Security to narrow the catalog.',
      side: 'bottom',
      align: 'start',
    },
  },
  ASK_BINA_STEP,
];

const ASSESSMENTS_TOUR_STEPS: DriveStep[] = [
  WELCOME_STEP,
  ...NAV_ROUTE_STEPS,
  {
    element: '[data-tour="tour-assessments-header"]',
    popover: {
      title: 'Skill assessments',
      description:
        'Track your progress, continue unfinished tests, and review skill levels matched to your plan.',
      side: 'bottom',
      align: 'start',
    },
    waitForElement: 4000,
  },
  {
    element: '[data-tour="tour-assessments-create"]',
    popover: {
      title: 'Create an assessment',
      description:
        'Start a new skill check to discover your level and unlock personalized course recommendations.',
      side: 'left',
      align: 'center',
    },
    waitForElement: 4000,
  },
  ASK_BINA_STEP,
];

const PRICING_TOUR_STEPS: DriveStep[] = [
  WELCOME_STEP,
  ...NAV_ROUTE_STEPS,
  {
    element: '[data-tour="tour-pricing-plans"]',
    popover: {
      title: 'Membership plans',
      description:
        'Compare Free, Standard, and Premium tiers — start with a free trial and upgrade when you need more capacity.',
      side: 'top',
      align: 'center',
    },
  },
  ASK_BINA_STEP,
];

const CONTACT_TOUR_STEPS: DriveStep[] = [
  WELCOME_STEP,
  ...NAV_ROUTE_STEPS,
  {
    element: '[data-tour="tour-contact-form"]',
    popover: {
      title: 'Contact our team',
      description:
        'Send support, billing, or partnership enquiries — we aim to respond within one business day.',
      side: 'left',
      align: 'start',
    },
  },
  ASK_BINA_STEP,
];

const STEPS_BY_PATH: Record<string, DriveStep[]> = {
  '/': HOME_TOUR_STEPS,
  '/courses': COURSES_TOUR_STEPS,
  '/assessments': ASSESSMENTS_TOUR_STEPS,
  '/pricing': PRICING_TOUR_STEPS,
  '/contact': CONTACT_TOUR_STEPS,
};

export function getTourStepsForPath(pathname: string): DriveStep[] {
  return STEPS_BY_PATH[pathname] ?? [WELCOME_STEP, ...NAV_ROUTE_STEPS, ASK_BINA_STEP];
}
