import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import {
  BeyondUsualGallerySection,
  DiscoverIndiaStorySection,
  FinalCtaSection,
  FindYourWaySection,
  LandingHeroSection,
  StayConfidenceSection,
} from '../components/LandingStorySections';
import { useApp } from '../contexts/AppContext';

export function LandingPage() {
  const { user } = useApp();
  const authDestination = user ? '/dashboard' : '/login';

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0C0B] text-[#F8F6F0]">
      <Navbar darkEditorial transparentOverHero />

      <main className="flex-1">
        <LandingHeroSection primaryCtaTo={authDestination} />
        <DiscoverIndiaStorySection />
        <FindYourWaySection />
        <BeyondUsualGallerySection />
        <StayConfidenceSection />
        <FinalCtaSection ctaTo={authDestination} />
      </main>

      <Footer darkSurface />
    </div>
  );
}
