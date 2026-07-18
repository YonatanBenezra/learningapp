import Link from 'next/link';
import {
  BookOpen,
  Check,
  CircleCheckBig,
  Flame,
  FlaskConical,
  GraduationCap,
  LayoutDashboard,
  Settings,
  Sparkles,
  Star,
  Terminal,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { buttonClasses } from '@/src/components/ui/button';
import { Container } from './Container';

const tabs = [
  { label: 'Course builder', icon: BookOpen },
  { label: 'Labs', icon: FlaskConical },
  { label: 'Quizzes', icon: CircleCheckBig },
  { label: 'Progress', icon: TrendingUp },
  { label: 'AI assistant', icon: Sparkles, active: true },
];

const sidebar = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Courses', icon: BookOpen },
  { label: 'Labs', icon: Terminal },
  { label: 'Achievements', icon: Trophy },
  { label: 'Settings', icon: Settings },
];

export function Hero() {
  return (
    <section id="top" className="relative pt-14 text-center">
      <Container>
        <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3.5 py-1.5 text-[12.5px] font-semibold text-primary">
          <Sparkles className="size-3.5" /> AI course builder + hands-on labs
        </span>

        <h1 className="mx-auto mt-5 max-w-[17ch] text-[clamp(2.4rem,6vw,4.1rem)] font-extrabold leading-[1.08] tracking-[-0.033em]">
          Turn Any Topic
          <span className="relative mx-3 inline-block size-14 rotate-45 rounded-[15px] bg-linear-to-br from-[#f6c650] to-[#e19a16] align-middle shadow-[0_16px_30px_-12px_rgba(225,154,22,0.55)]">
            <GraduationCap className="absolute inset-0 m-auto size-6 -rotate-45 text-[#49330a]" />
          </span>
          Into Real Skills
        </h1>

        <p className="mx-auto mt-5 max-w-[52ch] text-lg text-ink-2">
          One AI system builds your full course — modules, lessons, quizzes, exams — then drops you
          into real labs to actually practice.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/signup" className={buttonClasses({ size: 'lg' })}>
            Start Free Trial
          </Link>
          <Link href="#how" className={buttonClasses({ variant: 'soft', size: 'lg' })}>
            Book A Demo
          </Link>
        </div>

        {/* floating coins */}
        <span className="absolute left-[4%] top-32 hidden size-16 place-items-center rounded-full bg-linear-to-br from-[#37d083] to-[#22a863] text-white shadow-card md:grid">
          <Check className="size-6" strokeWidth={2.6} />
        </span>
        <span className="absolute right-[4%] top-40 hidden size-16 place-items-center rounded-full bg-linear-to-br from-primary to-primary-2 text-white shadow-card md:grid">
          <Star className="size-6" />
        </span>

        {/* feature tabs */}
        <div className="relative z-10 mt-12 flex flex-wrap justify-center gap-2.5">
          {tabs.map((t) => (
            <span
              key={t.label}
              className={
                t.active
                  ? 'inline-flex items-center gap-2 rounded-xl bg-[#17163a] px-4 py-2.5 text-[13.5px] font-medium text-white dark:bg-primary'
                  : 'inline-flex items-center gap-2 rounded-xl border border-line bg-bg px-4 py-2.5 text-[13.5px] font-medium text-ink-2 shadow-soft'
              }
            >
              <t.icon className="size-4" /> {t.label}
            </span>
          ))}
        </div>
      </Container>

      {/* dashboard mockup on a lavender pad */}
      <Container className="mt-6">
        <div className="rounded-t-[28px] bg-linear-to-b from-tint-lav to-transparent px-6 pt-8 sm:px-10">
          <div className="mx-auto max-w-[850px] overflow-hidden rounded-t-2xl border border-line bg-bg-elev text-left shadow-lift">
            <div className="flex items-center gap-2 border-b border-line bg-bg-soft px-4 py-3">
              <span className="flex gap-1.5">
                <i className="size-2.5 rounded-full bg-line-2" />
                <i className="size-2.5 rounded-full bg-line-2" />
                <i className="size-2.5 rounded-full bg-line-2" />
              </span>
              <span className="ml-2 rounded-md bg-bg-lav px-3 py-1 font-mono text-[11px] text-ink-3">
                app.abc.io/dashboard
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[190px_1fr]">
              <aside className="hidden flex-col gap-1 border-r border-line p-3 sm:flex">
                {sidebar.map((s) => (
                  <span
                    key={s.label}
                    className={
                      s.active
                        ? 'flex items-center gap-2.5 rounded-lg bg-primary-soft px-3 py-2.5 text-[13px] font-semibold text-primary'
                        : 'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-[13px] font-medium text-ink-2'
                    }
                  >
                    <s.icon className="size-4" /> {s.label}
                  </span>
                ))}
              </aside>

              <div className="flex flex-col gap-4 p-5">
                <div>
                  <div className="text-xs text-ink-3">Welcome back,</div>
                  <div className="text-lg font-bold">Rafi&rsquo;s dashboard</div>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { k: 'STREAK', v: '12', flame: true },
                    { k: 'COURSES', v: '3' },
                    { k: 'XP', v: '2,480' },
                  ].map((s) => (
                    <div key={s.k} className="rounded-xl border border-line p-3">
                      <div className="font-mono text-[11px] text-ink-3">{s.k}</div>
                      <div className="flex items-center gap-1 text-xl font-extrabold tracking-tight text-ink">
                        {s.v}
                        {s.flame && <Flame className="size-4 text-primary" />}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-line bg-linear-to-br from-tint-lav to-transparent p-4">
                  <div className="flex items-center justify-between">
                    <b className="text-sm">SOC Analyst — Level 1</b>
                    <span className="rounded-full bg-good-soft px-2.5 py-0.5 font-mono text-[10.5px] text-good">
                      68% done
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-line-2">
                    <div className="h-full w-[68%] rounded-full bg-linear-to-r from-primary to-primary-2" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 font-mono text-[10.5px] text-ink-3">
                    <span className="rounded-md border border-primary px-2 py-1 text-primary">
                      Module 02
                    </span>
                    <span className="rounded-md border border-dashed border-line-2 px-2 py-1">
                      Log Analysis
                    </span>
                    <span className="rounded-md border border-dashed border-line-2 px-2 py-1">
                      6 labs
                    </span>
                    <span className="rounded-md border border-dashed border-line-2 px-2 py-1">
                      3 exams
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
