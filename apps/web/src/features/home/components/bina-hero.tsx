import Link from "next/link";
import { routes } from "@/config/routes";
import "@/features/home/bina-hero.css";

export function BinaHero() {
  return (
    <section
      className="bina-hero relative w-full overflow-hidden"
      aria-labelledby="hero-title"
    >
      <img
        src="/images/hero-bg.webp"
        alt=""
        aria-hidden
        fetchPriority="high"
        loading="eager"
        decoding="async"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[right_center] max-sm:object-[70%_center]"
      />

      <div className="bina-hero-overlay-scrim pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[rgba(20,29,43,0.85)] from-0% via-transparent via-55% to-transparent"
        aria-hidden
      />
      <div className="bina-hero-blend-bottom pointer-events-none absolute inset-x-0 bottom-0" aria-hidden />

      <div className="bina-hero-inner relative z-10 flex min-h-[max(720px,85vh)] w-full items-center">
        <div className="max-w-[800px]">
          <h1
            id="hero-title"
            className="bina-hero-anim font-sans text-[34px] font-normal leading-[1.2] text-[#F4F4F4] md:text-[44px] lg:text-[60px] lg:leading-[75px]"
            style={{ fontFamily: '"Neue Haas Unica", "Inter", sans-serif' }}
          >
            Practice AI engineering
            <br />
            at production scale
          </h1>

          <p
            className="bina-hero-anim bina-hero-anim-delay-1 mt-10 max-w-[768px] font-sans text-base font-normal leading-[1.6] text-[#F4F4F4] md:text-lg lg:text-[20px] lg:leading-[32.5px]"
            style={{ fontFamily: '"Neue Haas Unica", "Inter", sans-serif' }}
          >
            Graded RAG, eval, and guardrails labs with hidden test sets and full
            traces—built for teams who ship real AI systems, not toy demos.
          </p>

          <div className="bina-hero-anim bina-hero-anim-delay-2 mt-14 flex flex-col gap-4 max-sm:w-full sm:flex-row sm:items-center">
            <Link
              href={routes.signUp}
              className="bina-hero-btn-primary inline-flex h-12 w-full items-center justify-center rounded-[4px] bg-[#ACED2C] px-6 py-3 text-base font-medium text-[#121C2B] transition-all duration-200 ease-in-out hover:bg-[#9FEF00] hover:shadow-[0_0_16px_rgba(159,239,0,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9FEF00] sm:w-auto"
            >
              Get started
            </Link>
            <Link
              href={routes.problems}
              className="bina-hero-btn-secondary inline-flex h-12 w-full items-center justify-center rounded-[4px] bg-[#242F40] px-6 py-3 text-base font-medium text-[#F4F4F4] transition-all duration-200 ease-in-out hover:bg-[#2E3B50] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9FEF00] sm:w-auto"
            >
              Browse problems
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
