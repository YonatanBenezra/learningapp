import { HomeHero } from "@/features/home/components/home-hero";
import { HomeLandingFooter } from "@/features/home/components/home-landing-footer";
import { HomeHowItWorksSection } from "@/features/home/components/home-how-it-works-section";
import { HomeLivePracticeSection } from "@/features/home/components/home-live-practice-section";
import { HomeStatsSection } from "@/features/home/components/home-stats-section";
import { HomeFinalCtaSection } from "@/features/home/components/home-final-cta-section";
import "./home.css";
import "./home-hero.css";
import "./home-how-it-works.css";
import "./home-live-practice.css";
import "./home-stats-cta.css";
import "./home-footer.css";
export function HomePage() {
  return (
    <div className="ag-page lp-app">
      <div className="lp-main lp-app-main lp-main--home">
        <div className="lp-page-home">
          <HomeHero />
          <HomeHowItWorksSection />
          <HomeLivePracticeSection />
          <HomeStatsSection />
          <HomeFinalCtaSection />
        </div>

        <HomeLandingFooter />
      </div>
    </div>
  );
}
