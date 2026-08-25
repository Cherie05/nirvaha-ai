import Hero from '../components/Hero';
import ProblemSection from '../components/ProblemSection';
import FieldStory from '../components/FieldStory';
import HowItWorks from '../components/HowItWorks';
import PlasticsGrid from '../components/PlasticsGrid';
import LiveDemo from '../components/LiveDemo';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#e8e4df] text-[#0c0c0c]">
      <Hero />
      <ProblemSection />
      <FieldStory />
      <HowItWorks />
      <PlasticsGrid />
      <LiveDemo />
      <Footer />
    </main>
  );
}
