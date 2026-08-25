import Navbar from '../components/Navbar';
import MarqueeTicker from '../components/MarqueeTicker';
import Hero from '../components/Hero';
import B2bModelSection from '../components/B2bModelSection';
import ProblemStory from '../components/ProblemStory';
import PlasticsMatrix from '../components/PlasticsMatrix';
import DemoShowcase from '../components/DemoShowcase';
import LogisticsSimulator from '../components/LogisticsSimulator';
import Metrics from '../components/Metrics';
import Architecture from '../components/Architecture';
import VcSection from '../components/VcSection';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#040d08]">
      <Navbar />
      <MarqueeTicker />
      <Hero />
      <B2bModelSection />
      <ProblemStory />
      <PlasticsMatrix />
      <DemoShowcase />
      <LogisticsSimulator />
      <Metrics />
      <Architecture />
      <VcSection />
    </main>
  );
}
