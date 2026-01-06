import { Navbar } from './components/navbar';
import { HeroSection } from './components/hero-section';
import { FeaturesSection } from './components/features-section';
import { Footer } from './components/footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <Footer />
    </div>
  );
}
