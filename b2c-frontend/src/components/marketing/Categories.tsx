'use client';
import { BookOpen, BrainCircuit, ChartColumn, Code2, HeartPulse, LockKeyhole, Network, ShieldCheck } from 'lucide-react';
import { Container } from './Container';

const categories = [
  { name: 'Programming', icon: Code2, color: '#1A7A5C' },
  { name: 'Artificial Intelligence', icon: BrainCircuit, color: '#2563EB' },
  { name: 'Cyber Security', icon: ShieldCheck, color: '#2563EB' },
  { name: 'Networking', icon: Network, color: '#F59E0B' },
  { name: 'Data Science', icon: ChartColumn, color: '#EC4899' },
  { name: 'Health & Fitness', icon: HeartPulse, color: '#DC2626' },
  { name: 'Security', icon: LockKeyhole, color: '#16A34A' },
  { name: 'General', icon: BookOpen, color: '#7C3AED' },
];

export function Categories() {
  return (
    <section className="relative overflow-hidden bg-white py-36">
      {/* ─── Background Blurs ─── */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 top-0 size-[600px] rounded-full bg-[#D4ECFF] opacity-50 blur-[140px]" />
        <div className="absolute -right-20 top-[20%] size-[500px] rounded-full bg-[#FFE4CC] opacity-45 blur-[130px]" />
        <div className="absolute bottom-0 left-[30%] size-[450px] rounded-full bg-[#EDE4FF] opacity-40 blur-[120px]" />
        <div className="absolute left-[10%] bottom-[20%] size-[350px] rounded-full bg-[#FFF3D6] opacity-35 blur-[110px]" />
      </div>

      {/* ─── Decorations ─── */}
      <div className="pointer-events-none absolute inset-0">
        {/* Yellow dotted square — top right */}
        <svg className="absolute right-[5%] top-[8%] size-14 opacity-20" viewBox="0 0 56 56">
          <circle cx="6" cy="6" r="2.5" fill="#F7C948" />
          <circle cx="18" cy="6" r="2.5" fill="#F7C948" />
          <circle cx="30" cy="6" r="2.5" fill="#F7C948" />
          <circle cx="42" cy="6" r="2.5" fill="#F7C948" />
          <circle cx="6" cy="18" r="2.5" fill="#F7C948" />
          <circle cx="18" cy="18" r="2.5" fill="#F7C948" />
          <circle cx="30" cy="18" r="2.5" fill="#F7C948" />
          <circle cx="42" cy="18" r="2.5" fill="#F7C948" />
          <circle cx="6" cy="30" r="2.5" fill="#F7C948" />
          <circle cx="18" cy="30" r="2.5" fill="#F7C948" />
          <circle cx="30" cy="30" r="2.5" fill="#F7C948" />
          <circle cx="42" cy="30" r="2.5" fill="#F7C948" />
          <circle cx="6" cy="42" r="2.5" fill="#F7C948" />
          <circle cx="18" cy="42" r="2.5" fill="#F7C948" />
          <circle cx="30" cy="42" r="2.5" fill="#F7C948" />
          <circle cx="42" cy="42" r="2.5" fill="#F7C948" />
        </svg>

        {/* Yellow curved strokes — bottom left */}
        <svg className="absolute bottom-[12%] left-[4%] size-16 opacity-15" viewBox="0 0 64 64" fill="none">
          <path d="M8 48 C20 20, 44 16, 56 28" stroke="#F7C948" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M12 56 C24 30, 48 26, 60 36" stroke="#F7C948" strokeWidth="2" strokeLinecap="round" />
        </svg>

        {/* Soft yellow blob — bottom right */}
        <div className="absolute -bottom-10 right-[8%] size-[200px] rounded-full bg-[#FFF4CC] opacity-40 blur-[60px]" />
      </div>

      <Container className="relative z-10">
        {/* ─── Section Header ─── */}
        <div className="mx-auto max-w-[700px] text-center">

          {/* Title */}
          <h2
            className="mx-auto mt-6 max-w-[800px] leading-[1.15] text-[#152238]"
            style={{ fontFamily: 'var(--font-open-sans)', fontWeight: 700, fontSize: 40 }}
          >
            Explore Top Courses{' '}
            <span className="relative inline-block">
              <span className="relative z-10">Categories</span>
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
            <br />
            That Change Yourself
          </h2>
        </div>

        {/* ─── Single Large Container ─── */}
        <div className="mx-auto mt-14 max-w-[1440px] overflow-hidden rounded-[24px] border border-[#E7E7E7] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.04)]">
          {/* 4-column × 2-row grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4">
            {categories.map((cat, i) => {
              const isRightCol = i % 4 === 3;
              const isBottomRow = i >= 4;

              return (
                <div
                  key={cat.name}
                  className="group flex cursor-pointer flex-col items-center justify-center py-10 transition-colors duration-200 hover:bg-[#FAFAFA]"
                  style={{
                    borderRight: isRightCol ? 'none' : '1px solid #E8E8E8',
                    borderBottom: isBottomRow ? 'none' : '1px solid #E8E8E8',
                  }}
                >
                  <div className="mb-6 flex size-[70px] items-center justify-center transition-transform duration-200 group-hover:scale-105">
                    <cat.icon
                      size={70}
                      strokeWidth={1.2}
                      style={{ color: cat.color }}
                    />
                  </div>
                  <span
                    className="text-center text-[22px] font-semibold text-[#152238]"
                    style={{ fontFamily: 'var(--font-open-sans)' }}
                  >
                    {cat.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
