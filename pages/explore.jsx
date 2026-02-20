import Head from 'next/head';
import Header from '../components/Header';
import SmartAnalyzer from '../components/SmartAnalyzer';

export default function ExplorePage() {
  return (
    <>
      <Head>
        <title>Explore | DMD</title>
        <meta
          name="description"
          content="Answer a few prompts with the DMD Smart Analyzer and discover personalized UAE property opportunities."
        />
      </Head>

      <Header />

      <section className="bg-black text-white">
        <div className="relative">
          <SmartAnalyzer />
        </div>
      </section>

      {/* Git push */}
      
      {/* Git push */}
      
    </>
  );
}
