'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  MonitorPlay,
  Users,
} from 'lucide-react';
import { Container } from './Container';

const avatars = [
  { src: 'https://i.pravatar.cc/150?img=1', size: 110, top: '170px', left: '150px', delay: 0 },
  { src: 'https://i.pravatar.cc/150?img=5', size: 95, top: '350px', left: '300px', delay: 0.5 },
  { src: 'https://i.pravatar.cc/150?img=8', size: 105, bottom: '210px', left: '170px', delay: 1 },
  { src: 'https://i.pravatar.cc/150?img=12', size: 105, top: '150px', right: '180px', delay: 0.3 },
  { src: 'https://i.pravatar.cc/150?img=16', size: 95, top: '330px', right: '260px', delay: 0.8 },
  { src: 'https://i.pravatar.cc/150?img=20', size: 110, bottom: '220px', right: '140px', delay: 1.2 },
];

const stats = [
  { icon: BookOpen, value: '1,090+', label: 'Our Online Courses' },
  { icon: Users, value: '120+', label: 'Our Instructors' },
  { icon: MonitorPlay, value: '145+', label: 'Total Video Lessons' },
  { icon: GraduationCap, value: '6,000+', label: 'Total Students Enrolled' },
];

export function Hero() {
  return (
    <section
      id="top"
      className="relative h-[900px] overflow-hidden bg-white"
    >
      {/* ─── Gradient Background ─── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 size-[700px] rounded-full bg-[#D4ECFF] opacity-60 blur-[140px]" />
        <div className="absolute -right-32 top-10 size-[600px] rounded-full bg-[#FFE4CC] opacity-55 blur-[140px]" />
        <div className="absolute bottom-20 left-[20%] size-[550px] rounded-full bg-[#FFDDD6] opacity-50 blur-[130px]" />
        <div className="absolute -right-20 bottom-10 size-[500px] rounded-full bg-[#EDE4FF] opacity-55 blur-[130px]" />
        <div className="absolute left-[40%] top-[30%] size-[400px] rounded-full bg-[#FFF3D6] opacity-45 blur-[120px]" />
        <div className="absolute -left-20 bottom-[30%] size-[350px] rounded-full bg-[#D6F0FF] opacity-40 blur-[110px]" />
      </div>

      {/* ─── Decorations ─── */}
      <div className="pointer-events-none absolute inset-0">
        {/* Yellow confetti — top left */}
        <svg className="absolute left-[12%] top-[18%] size-14 opacity-20" viewBox="0 0 56 56">
          <circle cx="6" cy="6" r="2.5" fill="#F7C948" />
          <circle cx="18" cy="6" r="2.5" fill="#F7C948" />
          <circle cx="30" cy="6" r="2.5" fill="#F7C948" />
          <circle cx="6" cy="18" r="2.5" fill="#F7C948" />
          <circle cx="18" cy="18" r="2.5" fill="#F7C948" />
          <circle cx="30" cy="18" r="2.5" fill="#F7C948" />
          <circle cx="6" cy="30" r="2.5" fill="#F7C948" />
          <circle cx="18" cy="30" r="2.5" fill="#F7C948" />
          <circle cx="30" cy="30" r="2.5" fill="#F7C948" />
        </svg>

        {/* Curved yellow lines — bottom left */}
        <svg className="absolute bottom-[38%] left-[7%] size-16 opacity-15" viewBox="0 0 64 64" fill="none">
          <path d="M8 48 C20 20, 44 16, 56 28" stroke="#F7C948" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M12 56 C24 30, 48 26, 60 36" stroke="#F7C948" strokeWidth="2" strokeLinecap="round" />
        </svg>

        {/* Purple dotted blob — top right */}
        <svg className="absolute right-[8%] top-[14%] size-24 opacity-12" viewBox="0 0 96 96">
          {[...Array(8)].map((_, row) =>
            [...Array(8)].map((__, col) => (
              <circle
                key={`${row}-${col}`}
                cx={col * 12 + 6}
                cy={row * 12 + 6}
                r={1.5 + ((row + col) % 3)}
                fill="#7C3AED"
              />
            )),
          )}
        </svg>

        {/* Yellow circle — right */}
        <svg className="absolute right-[6%] top-[45%] size-12 opacity-15" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="#F7C948" strokeWidth="2.5" />
        </svg>

        {/* Small purple outline — bottom right */}
        <svg className="absolute bottom-[32%] right-[9%] size-16 opacity-10" viewBox="0 0 64 64">
          <polygon points="32,4 60,20 52,52 12,52 4,20" fill="none" stroke="#7C3AED" strokeWidth="2" />
        </svg>
      </div>

      {/* ─── Floating Avatars ─── */}
      {avatars.map((a, i) => (
        <motion.div
          key={i}
          className="absolute z-10 hidden overflow-hidden rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.1)] lg:block"
          style={{
            width: a.size,
            height: a.size,
            top: 'top' in a ? a.top : undefined,
            bottom: 'bottom' in a ? a.bottom : undefined,
            left: 'left' in a ? a.left : undefined,
            right: 'right' in a ? a.right : undefined,
          }}
          animate={{ y: [-8, 8] }}
          transition={{
            duration: 5 + i * 0.5,
            repeat: Infinity,
            repeatType: 'reverse',
            ease: 'easeInOut',
            delay: a.delay,
          }}
        >
          <img
            src={a.src}
            alt={`Student ${i + 1}`}
            className="size-full object-cover"
            loading="lazy"
          />
        </motion.div>
      ))}

      {/* ─── Main Content ─── */}
      <Container className="relative z-20 pt-[160px] lg:pt-[170px]">
        <div className="mx-auto max-w-[780px] text-center">
          {/* Headline */}
          <motion.h1
            className="mx-auto max-w-[780px] text-[clamp(2.5rem,5vw,72px)] font-[800] leading-[1.05] tracking-tight text-[#111827]"
            style={{ fontFamily: 'var(--font-poppins)' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            Unlock Your Potential with
            <br />
            Expert Online{' '}
            <span className="relative inline-block">
              <span className="relative z-10">Learning</span>
              <svg
                className="absolute -bottom-1 left-0 z-0 h-[18px] w-full"
                viewBox="0 0 200 20"
                preserveAspectRatio="none"
                fill="none"
              >
                <path
                  d="M2 14C30 6 70 2 100 4C130 6 170 10 198 6"
                  stroke="#F7C948"
                  strokeWidth="8"
                  strokeLinecap="round"
                  opacity="0.7"
                />
              </svg>
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            className="mx-auto mt-7 max-w-[780px] text-[18px] leading-[1.8] text-[#6B7280]"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            Join Educeet to explore high-quality online courses, gain real-world
            skills, and achieve your goals with guidance from expert
            instructors—anytime, anywhere, at your pace.
          </motion.p>

          {/* Buttons */}
          <motion.div
            className="mt-10 flex flex-wrap items-center justify-center gap-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.45 }}
          >
            <Link
              href="/courses"
              className="group inline-flex h-[50px] items-center gap-2.5 rounded-xl bg-[#0D6E63] px-[34px] text-[16px] font-semibold text-white shadow-[0_4px_14px_rgba(13,110,99,0.35)] transition-all duration-300 hover:-translate-y-[3px] hover:bg-[#095c52] hover:shadow-[0_8px_25px_rgba(13,110,99,0.45)]"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              Find Courses
              <ArrowRight className="size-5 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-[50px] items-center gap-2.5 rounded-xl border border-[#0D6E63] bg-transparent px-[34px] text-[16px] font-semibold text-[#0D6E63] transition-all duration-300 hover:bg-[#F8FAFA]"
              style={{ fontFamily: 'var(--font-poppins)' }}
            >
              Apply Now
              <ArrowRight className="size-5" />
            </Link>
          </motion.div>
        </div>
      </Container>

      {/* ─── Bottom Stats Card ─── */}
      <motion.div
        className="absolute bottom-0 left-1/2 z-30 w-full -translate-x-1/2 px-6 pb-0"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.6 }}
      >
        <div className="mx-auto max-w-[1200px]">
          {/* Green card with curved top */}
          <div className="rounded-t-[70px] rounded-b-[28px] bg-[#0C665B] px-14 py-8 shadow-[0_-4px_30px_rgba(12,102,91,0.25)] ring-1 ring-[#F6C23E]/20">
            <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl border border-[#F6C23E]/30 bg-[#F6C23E]/10">
                    <s.icon className="size-7 text-[#F6C23E]" />
                  </div>
                  <div>
                    <div
                      className="text-[16px] font-semibold leading-none text-white md:text-[22px]"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      {s.value}
                    </div>
                    <div
                      className="mt-2 text-[12px] font-semibold text-[#E8F4F2] md:text-[16px]"
                      style={{ fontFamily: 'var(--font-poppins)' }}
                    >
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* Thin yellow bottom border */}
          <div className="mx-auto h-[3px] w-full rounded-b-full bg-gradient-to-r from-transparent via-[#F6C23E] to-transparent opacity-60" />
        </div>
      </motion.div>

      {/* ─── Bottom White Wave Curve ─── */}
      <div className="absolute bottom-[-1px] left-0 right-0 z-20">
        <svg
          className="w-full"
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 80V30C200 0 500 0 720 20C940 40 1200 60 1440 30V80H0Z"
            fill="white"
          />
        </svg>
      </div>
    </section>
  );
}
