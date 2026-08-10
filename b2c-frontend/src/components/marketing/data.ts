import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Brain,
  Code2,
  Dumbbell,
  LayoutGrid,
  Network,
  Shield,
  ShieldCheck,
} from 'lucide-react';

export const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Courses', href: '/courses' },
  { label: 'Assessments', href: '/assessments' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Contact', href: '/contact' },
] as const;

export const CATEGORIES: {
  title: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
}[] = [
  {
    title: 'Programming',
    icon: Code2,
    iconBg: 'bg-primary-soft',
    iconColor: 'text-primary',
  },
  {
    title: 'Artificial Intelligence',
    icon: Brain,
    iconBg: 'bg-tint-lav',
    iconColor: 'text-[#7C3AED]',
  },
  {
    title: 'Cyber Security',
    icon: ShieldCheck,
    iconBg: 'bg-tint-mint',
    iconColor: 'text-good',
  },
  {
    title: 'Networking',
    icon: Network,
    iconBg: 'bg-tint-blue',
    iconColor: 'text-[#2563EB]',
  },
  {
    title: 'Data Science',
    icon: BarChart3,
    iconBg: 'bg-tint-peach',
    iconColor: 'text-secondary',
  },
  {
    title: 'Health & Fitness',
    icon: Dumbbell,
    iconBg: 'bg-tint-pink',
    iconColor: 'text-[#DB2777]',
  },
  {
    title: 'Security',
    icon: Shield,
    iconBg: 'bg-bg-soft',
    iconColor: 'text-primary-deep',
  },
  {
    title: 'General',
    icon: LayoutGrid,
    iconBg: 'bg-tint-lime',
    iconColor: 'text-[#65A30D]',
  },
];

export const CLASS_DAYS = [
  { day: 'Saturday', time: '10:00 - 16:00' },
  { day: 'Sunday', time: '10:00 - 16:00' },
  { day: 'Monday', time: '10:00 - 16:00' },
  { day: 'Tuesday', time: '10:00 - 16:00' },
  { day: 'Wednesday', time: '10:00 - 16:00' },
] as const;

export type CourseCategory = 'All Categories' | 'Design' | 'Programming' | 'Marketing';

export const COURSE_FILTERS: CourseCategory[] = [
  'All Categories',
  'Design',
  'Programming',
  'Marketing',
];

export const COURSES: {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviews: number;
  instructor: string;
  experience: string;
  level: string;
  lessons: number;
  students: number;
  duration: string;
  category: Exclude<CourseCategory, 'All Categories'>;
  image: string;
  avatar: string;
}[] = [
  {
    id: '1',
    title: "Getting Started with Computers and Beginner's Guide to Basic Skills",
    price: 240,
    originalPrice: 320,
    rating: 4.5,
    reviews: 129,
    instructor: 'Sarah Alison',
    experience: '10+ Years Experience',
    level: 'Beginner',
    lessons: 45,
    students: 50,
    duration: '620h, 55min',
    category: 'Programming',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop',
    avatar: 'https://i.pravatar.cc/80?img=5',
  },
  {
    id: '2',
    title: 'Cooking Made Easy: Essential Skills for Everyday Meals',
    price: 9,
    originalPrice: 20,
    rating: 4.5,
    reviews: 129,
    instructor: 'Mitchel March',
    experience: '8+ Years Experience',
    level: 'Advance',
    lessons: 20,
    students: 50,
    duration: '12h, 55min',
    category: 'Design',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&h=400&fit=crop',
    avatar: 'https://i.pravatar.cc/80?img=12',
  },
  {
    id: '3',
    title: 'Design Thinking Researching for Better UX',
    price: 9,
    originalPrice: 20,
    rating: 4.5,
    reviews: 129,
    instructor: 'Mr. Harry',
    experience: '12+ Years Experience',
    level: 'Entry Level',
    lessons: 20,
    students: 50,
    duration: '620h, 55min',
    category: 'Design',
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&h=400&fit=crop',
    avatar: 'https://i.pravatar.cc/80?img=33',
  },
  {
    id: '4',
    title: 'Photography for Everyone: How to Capture Stunning Photos with Ease',
    price: 350,
    originalPrice: 420,
    rating: 4.5,
    reviews: 129,
    instructor: 'Alisa Olivia',
    experience: '6+ Years Experience',
    level: 'Advance',
    lessons: 20,
    students: 50,
    duration: '156h, 55min',
    category: 'Design',
    image: 'https://images.unsplash.com/photo-1452587925148-ce544e77ae70?w=600&h=400&fit=crop',
    avatar: 'https://i.pravatar.cc/80?img=47',
  },
  {
    id: '5',
    title: 'Writing Made Simple: From Ideas to Finished Pieces for All Levels',
    price: 150,
    originalPrice: 199,
    rating: 4.5,
    reviews: 129,
    instructor: 'Jordan Walk',
    experience: '9+ Years Experience',
    level: 'Medium',
    lessons: 20,
    students: 50,
    duration: '326h, 55min',
    category: 'Marketing',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&h=400&fit=crop',
    avatar: 'https://i.pravatar.cc/80?img=68',
  },
  {
    id: '6',
    title: "A Beginner's Guide to Building Your Online Presence",
    price: 290,
    originalPrice: 360,
    rating: 4.5,
    reviews: 129,
    instructor: 'Aman Ellison',
    experience: '7+ Years Experience',
    level: 'Beginner',
    lessons: 20,
    students: 50,
    duration: '620h, 55min',
    category: 'Marketing',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
    avatar: 'https://i.pravatar.cc/80?img=15',
  },
];

export const WHY_CHOOSE = [
  {
    title: 'It provides tools for course creation,',
    body: 'Enrollment management, and tracking learner progress, ensuring a streamlined learning experience.',
  },
  {
    title: 'Many LMS platforms include collaborative',
    body: 'Features such as discussion forums, messaging, which facilitate interaction and communication among learners and instructors.',
  },
  {
    title: 'An effective LMS offers robust analytics',
    body: 'Reporting features that enable businesses to track learner performance. This data helps organizations assess the effectiveness of their training programs.',
  },
] as const;

export const STATS = [
  { value: '10', suffix: 'K+', label: 'Successfully Student' },
  { value: '10', suffix: 'K+', label: 'Courses Completed' },
  { value: '10', suffix: 'M+', label: 'Satisfied Review' },
  { value: '10', suffix: 'K+', label: 'Successfully Student' },
] as const;

export const INSTRUCTORS = [
  {
    name: 'Thomas Alison',
    role: 'Graphics Designer',
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=500&fit=crop',
  },
  {
    name: 'Monalisa Olivia',
    role: 'Fashion Designer',
    image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=500&fit=crop',
  },
  {
    name: 'Richard Mark',
    role: 'UI Designer',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop',
  },
  {
    name: 'Sarah Amanda',
    role: 'Product Designer',
    image: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=500&fit=crop',
  },
] as const;

export const LIVE_CLASSES = [
  {
    title: 'Master Python Programming for Beginners and Beyond',
    lessons: 45,
    duration: '620h 55min',
  },
  {
    title: 'Meet the Team: Passionate People, Exceptional Talent',
    lessons: 45,
    duration: '620h 55min',
  },
  {
    title: 'The Faces Behind the Brand, Dedicated, Driven',
    lessons: 45,
    duration: '620h 55min',
  },
] as const;

export const TESTIMONIALS = [
  {
    quote:
      'It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.',
    name: 'Mitchel Clack',
    role: 'Tech Specialist',
    avatar: 'https://i.pravatar.cc/100?img=11',
  },
  {
    quote:
      'It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing.',
    name: 'Mitchela Smith',
    role: 'Tech Specialist',
    avatar: 'https://i.pravatar.cc/100?img=25',
  },
  {
    quote:
      'Recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum passages for modern learners.',
    name: 'Sarah Smith',
    role: 'Tech Specialist',
    avatar: 'https://i.pravatar.cc/100?img=32',
  },
] as const;

export const FOOTER_CONTACT: {
  label: string;
  value: string;
  href?: string;
  icon: 'mail' | 'phone' | 'location';
}[] = [
  {
    label: 'Email Address:',
    value: 'info@example.com',
    href: 'mailto:info@example.com',
    icon: 'mail',
  },
  {
    label: 'Phone Number',
    value: '+00 123 (99) 57689',
    href: 'tel:001239957689',
    icon: 'phone',
  },
  {
    label: 'Our Address',
    value: '1234 Elm Street Springfield,',
    icon: 'location',
  },
];

export const FOOTER_QUICK_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/#categories' },
  { label: 'Courses', href: '/courses' },
  { label: 'FAQs', href: '/#faq' },
  { label: 'Contact', href: '/contact' },
] as const;

export const FOOTER_LINKS = {
  quick: FOOTER_QUICK_LINKS,
  categories: CATEGORIES.slice(0, 6).map((category) => category.title),
} as const;
