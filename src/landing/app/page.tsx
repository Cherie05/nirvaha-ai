import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import ProblemStory from '../components/ProblemStory';
import DemoShowcase from '../components/DemoShowcase';
import Metrics from '../components/Metrics';
import Architecture from '../components/Architecture';
import VcSection from '../components/VcSection';

export default function Home() {
  return (
    <main className="min-h-screen bg-[#060e0a]">
      <Navbar />
      <Hero />
      <ProblemStory />
      <DemoShowcase />
      <Metrics />
      <Architecture />
      <VcSection />
    </main>
  );
}
