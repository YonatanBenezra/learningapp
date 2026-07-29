'use client';

import { motion } from 'framer-motion';
import { BookOpen, Brain, Shield, Sparkles } from 'lucide-react';

const HIGHLIGHTS = [
  'AI-built courses tailored to your level',
  'Hands-on labs and structured assessments',
  'Track progress across modules and lessons',
];

export function AuthIllustration() {
  return (
    <div className="relative flex h-full min-h-[600px] items-center justify-center overflow-hidden rounded-r-2xl bg-[linear-gradient(160deg,var(--primary)_0%,var(--primary-dark)_100%)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[12%] top-[18%] size-36 rotate-45 rounded-xl border border-white/10 bg-white/5" />
        <div className="absolute bottom-[22%] right-[14%] size-28 -rotate-12 rounded-xl border border-white/10 bg-white/5" />
        <div className="absolute right-[20%] top-[40%] size-24 rotate-45 rounded-xl border border-white/8 bg-white/5" />
      </div>

      <div className="relative z-10 flex w-full max-w-sm flex-col gap-5 p-8">
        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 backdrop-blur-sm">
          <Sparkles className="size-3.5" />
          AI-powered learning platform
        </div>

        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Learn with clarity.</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            Build skills through structured courses, assessments, and practical learning paths.
          </p>
        </div>

        <div className="w-full rounded-xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-white/15">
              <BookOpen className="size-4 text-white/90" />
            </div>
            <div>
              <p className="text-xs font-medium text-white/60">Your learning path</p>
              <p className="text-lg font-bold text-white">Courses · Labs · Assessments</p>
            </div>
            <div className="ml-auto grid size-10 place-items-center rounded-full bg-white/15">
              <Brain className="size-4 text-white/90" />
            </div>
          </div>

          <ul className="space-y-2.5">
            {HIGHLIGHTS.map((item, index) => (
              <motion.li
                key={item}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + index * 0.08 }}
                className="flex items-start gap-2 text-xs leading-relaxed text-white/75"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-secondary" />
                {item}
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="flex items-center gap-2.5 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
          <Shield className="size-4 text-white/85" />
          <span className="text-xs font-medium text-white/80">Secure sign-in · Your data stays protected</span>
        </div>
      </div>
    </div>
  );
}
