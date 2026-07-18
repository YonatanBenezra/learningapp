import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Code2,
  Network,
  Shield,
  Terminal,
  X,
} from 'lucide-react';
import { buttonClasses } from '@/src/components/ui/button';
import { Container } from './Container';

function Eyebrow({ children, tone = 'primary' }: { children: React.ReactNode; tone?: 'primary' | 'good' }) {
  return (
    <span
      className={
        tone === 'good'
          ? 'inline-flex rounded-full bg-good-soft px-3.5 py-1.5 text-[12.5px] font-semibold text-good'
          : 'inline-flex rounded-full bg-primary-soft px-3.5 py-1.5 text-[12.5px] font-semibold text-primary'
      }
    >
      {children}
    </span>
  );
}

function SectionHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="mx-auto mb-11 flex max-w-[640px] flex-col items-center gap-3.5 text-center">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="text-[clamp(1.75rem,4vw,2.6rem)] font-bold tracking-tight">{title}</h2>
      {sub && <p className="text-[17px] text-ink-2">{sub}</p>}
    </div>
  );
}

/* ---------- Why (problem / solution) ---------- */
function Gauge({ value, color, deg }: { value: string; color: string; deg: string }) {
  return (
    <div className="relative mx-auto h-[110px] w-[200px]">
      <svg viewBox="0 0 200 110" className="h-full w-full">
        <path
          d="M12 100 A88 88 0 0 1 188 100"
          fill="none"
          stroke="var(--line-2)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path d={deg} fill="none" stroke={color} strokeWidth="14" strokeLinecap="round" />
      </svg>
      <div className="absolute inset-x-0 bottom-1.5 text-center text-3xl font-extrabold" style={{ color }}>
        {value}
      </div>
      <div className="absolute inset-x-0 -bottom-3.5 text-center font-mono text-[11px] text-ink-3">
        avg. completion
      </div>
    </div>
  );
}

export function WhySection() {
  return (
    <section className="py-20">
      <Container>
        <SectionHead
          eyebrow="The gap"
          title="Your problem, our solution."
          sub="Most online learning is passive. ABC makes it structured, hands-on, and measurable."
        />
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-[22px] border border-line bg-linear-to-b from-bad-soft to-bg p-8">
            <h3 className="text-xl font-bold">The old way</h3>
            <p className="mb-4 mt-1 text-sm text-ink-2">
              Scattered videos and PDFs. You watch, you forget, you never really practice.
            </p>
            <Gauge value="18%" color="var(--bad)" deg="M12 100 A88 88 0 0 1 60 26" />
            <div className="mt-9 flex flex-col gap-2.5">
              {['Scattered resources', 'Passive, no practice', 'No feedback or proof'].map((t) => (
                <div
                  key={t}
                  className="flex items-center gap-2.5 rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm text-ink-2"
                >
                  <X className="size-4 text-bad" strokeWidth={2.4} /> {t}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[22px] border border-line bg-linear-to-b from-good-soft to-bg p-8">
            <h3 className="text-xl font-bold">With ABC</h3>
            <p className="mb-4 mt-1 text-sm text-ink-2">
              A structured AI course + real labs + auto-grading. You build the skill and prove it.
            </p>
            <Gauge value="89%" color="var(--good)" deg="M12 100 A88 88 0 0 1 176 74" />
            <div className="mt-9 flex flex-col gap-2.5">
              {['Structured AI course', 'Real hands-on labs', 'Auto-graded + streaks'].map((t) => (
                <div
                  key={t}
                  className="flex items-center gap-2.5 rounded-xl border border-line bg-bg px-3.5 py-2.5 text-sm text-ink-2"
                >
                  <Check className="size-4 text-good" strokeWidth={2.6} /> {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Features ---------- */
export function FeaturesSection() {
  return (
    <section id="features" className="bg-bg-soft py-20">
      <Container>
        <SectionHead
          eyebrow="Features"
          title="Smarter learning starts here."
          sub="Everything a course needs — assembled by AI, practiced for real."
        />
        <div className="grid gap-4.5 md:grid-cols-2">
          <div className="rounded-[20px] border border-line bg-tint-blue p-7">
            <h3 className="text-[19px] font-bold">AI course generation</h3>
            <p className="mt-2 max-w-[38ch] text-[14.5px] text-ink-2">
              Describe a topic and level. Get a full Course → Module → Lesson structure, with
              quizzes and exams, in seconds.
            </p>
            <div className="mt-5 rounded-2xl border border-line bg-bg p-3.5 text-[12.5px] shadow-soft">
              <div className="flex items-center gap-2 py-1.5">
                <span className="rounded-md bg-good-soft px-2 py-0.5 font-mono text-[10px] text-good">✓</span>
                Module 01 — Triage &amp; Alerts
              </div>
              <div className="flex items-center gap-2 border-t border-line py-1.5">
                <span className="rounded-md bg-good-soft px-2 py-0.5 font-mono text-[10px] text-good">✓</span>
                Module 02 — Log Analysis &amp; SIEM
              </div>
              <div className="flex items-center gap-2 border-t border-line py-1.5">
                <span className="rounded-md bg-warn-soft px-2 py-0.5 font-mono text-[10px] text-warn">…</span>
                Module 03 — Incident Response
              </div>
            </div>
          </div>

          <div className="rounded-[20px] border border-line bg-tint-mint p-7">
            <h3 className="text-[19px] font-bold">Hands-on domain labs</h3>
            <p className="mt-2 max-w-[38ch] text-[14.5px] text-ink-2">
              SOC triage, packet analysis, sandboxed code and a live terminal — real, isolated
              environments.
            </p>
            <div className="mt-5 rounded-2xl border border-line bg-bg p-3.5 text-[12.5px] shadow-soft">
              <div className="flex items-center gap-2 py-1.5">
                <span className="rounded-md bg-bad-soft px-2 py-0.5 font-mono text-[10px] text-bad">high</span>
                invoice.exe from paypa1.com
              </div>
              <div className="flex items-center gap-2 border-t border-line py-1.5">
                <span className="rounded-md bg-warn-soft px-2 py-0.5 font-mono text-[10px] text-warn">med</span>
                powershell -enc on HOST-14
              </div>
              <div className="flex items-center gap-2 border-t border-line py-1.5">
                <span className="rounded-md bg-bad-soft px-2 py-0.5 font-mono text-[10px] text-bad">high</span>
                C2 → 45.33.12.8
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4.5 grid gap-4.5 md:grid-cols-3">
          <div className="rounded-[20px] border border-line bg-tint-peach p-7">
            <h3 className="text-[19px] font-bold">Auto-graded quizzes</h3>
            <p className="mt-2 text-[14.5px] text-ink-2">Instant feedback every attempt.</p>
          </div>
          <div className="rounded-[20px] border border-line bg-tint-pink p-7">
            <h3 className="text-[19px] font-bold">Progress &amp; streaks</h3>
            <p className="mt-2 text-[14.5px] text-ink-2">See exactly how far you&rsquo;ve come.</p>
            <div className="mt-4 flex h-[90px] items-end gap-2">
              {[40, 60, 45, 80, 70, 100].map((h, i) => (
                <span
                  key={i}
                  style={{ height: `${h}%` }}
                  className="flex-1 rounded-t-md bg-linear-to-b from-primary to-primary-2"
                />
              ))}
            </div>
          </div>
          <div className="rounded-[20px] border border-line bg-tint-lime p-7">
            <h3 className="text-[19px] font-bold">Any skill, any level</h3>
            <p className="mt-2 text-[14.5px] text-ink-2">From first-timer to advanced.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-primary px-3.5 py-2 text-xs font-semibold text-primary-ink">
                Beginner
              </span>
              {['Intermediate', 'Advanced', 'SOC', 'Code'].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-line bg-bg px-3.5 py-2 text-xs font-semibold"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Lab band ---------- */
export function LabBand() {
  return (
    <section className="py-20">
      <Container>
        <div className="grid overflow-hidden rounded-3xl border border-line bg-linear-to-br from-tint-lav to-tint-blue md:grid-cols-2">
          <div className="self-center p-11">
            <Eyebrow>Your lab, your control</Eyebrow>
            <h2 className="mt-3.5 text-[clamp(1.6rem,3.4vw,2.1rem)] font-bold tracking-tight">
              Practice in real, sandboxed environments.
            </h2>
            <p className="mb-5 mt-3 max-w-[40ch] text-base text-ink-2">
              Run code, triage alerts, work a terminal — all network-isolated and resource-capped.
              Submit, get graded, keep learning.
            </p>
            <Link href="/signup" className={buttonClasses({})}>
              Explore labs
            </Link>
          </div>
          <div className="self-center p-7">
            <div className="rounded-2xl bg-[#14132a] p-4 font-mono text-[12.5px] leading-7 text-[#d9d6f5] shadow-card">
              <div>
                <span className="text-primary-2">$</span> abc lab run soc-triage
              </div>
              <div className="text-ink-3">{'// 3 alerts loaded · network none · read-only'}</div>
              <div>
                <span className="text-[#5ed6a0]">?</span> C2 callback IP →{' '}
                <span className="text-primary-2">45.33.12.8</span>
              </div>
              <div>
                <span className="text-[#5ed6a0]">✓</span> correct ·{' '}
                <span className="text-[#5ed6a0]">+120 XP</span> · graded in 40ms
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Stats ---------- */
export function StatsSection() {
  return (
    <section className="py-20">
      <Container>
        <div className="rounded-[26px] bg-bg-lav px-6 py-14 text-center">
          <Eyebrow>Trusted at scale</Eyebrow>
          <div className="mt-4 bg-linear-to-br from-primary to-primary-2 bg-clip-text text-[clamp(3.5rem,10vw,6.9rem)] font-extrabold leading-none tracking-[-0.04em] text-transparent">
            50,000+
          </div>
          <div className="mt-2.5 text-base text-ink-2">
            courses generated · lessons completed · labs solved
          </div>
          <div className="mt-7 flex flex-wrap justify-center gap-3.5">
            {['⚡ 12s avg. generation', '🧪 4 lab domains', '🔒 Sandbox-isolated', '🌍 GDPR-ready'].map(
              (b) => (
                <span
                  key={b}
                  className="rounded-full border border-line bg-bg px-4.5 py-2.5 text-[13px] font-semibold shadow-soft"
                >
                  {b}
                </span>
              ),
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Process ---------- */
const steps = [
  { n: '01', t: 'Brief it', p: 'Pick a subject, a level, and a few topics you care about. Thirty seconds.' },
  { n: '02', t: 'It drafts', p: 'AI generates the full course — modules, lessons, quizzes and exams — in seconds.' },
  { n: '03', t: 'You build & prove', p: 'Practice in real labs, get auto-graded, and watch your streak and progress climb.' },
];

export function ProcessSection() {
  return (
    <section id="how" className="bg-bg-soft py-20">
      <Container>
        <SectionHead eyebrow="How it works" title="From topic to real skill in three moves." />
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div className="flex flex-col gap-3.5">
            {steps.map((s) => (
              <div
                key={s.n}
                className="grid grid-cols-[auto_1fr] gap-4 rounded-2xl border border-line p-5 transition hover:border-primary"
              >
                <div className="grid size-11 place-items-center rounded-xl bg-primary-soft font-mono font-extrabold text-primary">
                  {s.n}
                </div>
                <div>
                  <h3 className="text-[17px] font-bold">{s.t}</h3>
                  <p className="mt-0.5 text-sm text-ink-2">{s.p}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-[20px] border border-line bg-bg-lav p-7">
            <div className="rounded-2xl border border-line bg-bg p-4 shadow-soft">
              <div className="mb-3 text-sm font-semibold">Which technique does this traffic show?</div>
              <div className="mb-2 rounded-xl border border-line px-3 py-2.5 text-[13px]">DDoS attack</div>
              <div className="mb-2 flex items-center rounded-xl border border-good bg-good-soft px-3 py-2.5 text-[13px] font-semibold text-good">
                Port scan <Check className="ml-auto size-4" strokeWidth={2.6} />
              </div>
              <div className="rounded-xl border border-line px-3 py-2.5 text-[13px]">DNS tunneling</div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- Domains ---------- */
const domains = [
  { icon: Shield, t: 'Cybersecurity', p: 'SOC triage, alert analysis, incident response.', grad: 'from-primary to-primary-2' },
  { icon: Network, t: 'Networking', p: 'SIEM, packet capture, flow analysis.', grad: 'from-[#0fb5c9] to-[#5ed6e6]' },
  { icon: Code2, t: 'Programming', p: 'Sandboxed code execution, real output.', grad: 'from-[#e1521f] to-[#f79b6b]' },
  { icon: Terminal, t: 'Systems', p: 'Emulated terminal, safe command practice.', grad: 'from-good to-[#6fe0a6]' },
];

export function DomainsSection() {
  return (
    <section id="domains" className="py-20">
      <Container>
        <SectionHead eyebrow="Domains" title="Real results across every track." />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {domains.map((d) => (
            <div
              key={d.t}
              className="overflow-hidden rounded-[18px] border border-line bg-bg transition hover:-translate-y-1 hover:shadow-card"
            >
              <div className={`grid h-[120px] place-items-center bg-linear-to-br ${d.grad}`}>
                <d.icon className="size-10 text-white" />
              </div>
              <div className="p-4.5">
                <h4 className="text-[15.5px] font-bold">{d.t}</h4>
                <p className="mt-1 text-[13px] text-ink-2">{d.p}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- CTA ---------- */
export function CtaSection() {
  return (
    <section className="py-20">
      <Container>
        <div className="grid items-center gap-8 rounded-[28px] bg-linear-to-br from-primary to-[#5a49d6] p-14 text-white md:grid-cols-[1.3fr_1fr]">
          <div>
            <h2 className="text-[clamp(1.6rem,3.6vw,2.4rem)] font-bold">
              Join the learners getting smarter.
            </h2>
            <p className="mt-3 text-white/80">
              Draft your first AI course free and open your first lab in under a minute.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-semibold text-primary transition hover:brightness-95"
              >
                Start Free Trial
              </Link>
              <Link
                href="#how"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/40 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Book a demo
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-white/10 p-4">
            <div className="text-sm">
              <div className="font-semibold">Have a topic in mind?</div>
              <div className="text-white/70">Your first course is 30 seconds away.</div>
            </div>
            <Link
              href="/signup"
              className="ml-auto grid size-10 flex-none place-items-center rounded-xl bg-white text-primary"
              aria-label="Get started"
            >
              <ArrowRight className="size-5" />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
