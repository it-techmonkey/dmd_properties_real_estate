import Head from 'next/head';
import Image from 'next/image';
import Hero from '../components/Hero';
import Blog from '../components/Blog';
import Services from '../components/Services';
import NewlyLaunched from '../components/NewlyLaunched';
import LogoCarousel from '../components/LogoCarousel';
import PropertyExplorer from '../components/PropertyExplorer';

export default function Home() {
  return (
    <>
      <Head>
        <title>DMD</title>
        <meta name="description" content="Premium real estate and investment opportunities in the world's most sought-after locations." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Main wrapper for blur effects to flow between sections */}
      <div className="relative bg-black overflow-x-hidden">
        {/* Hero Blur 1 - Right side */}
        <div className="absolute right-[0px] top-[0%] pointer-events-none z-0">
          <Image
            src="/HeroBlur.svg"
            alt=""
            width={1151}
            height={1163}
            className="w-[600px] lg:w-[900px] xl:w-[1300px]"
            priority
          />
        </div>

        {/* Hero Blur 2 - Left/Center */}
        <div className="absolute left-[-300px] top-[10%] pointer-events-none z-0">
          <Image
            src="/HeroBlur2.svg"
            alt=""
            width={1169}
            height={1136}
            className="w-[700px] lg:w-[1000px]"
            priority
          />
        </div>

        {/* Property Explorer Blur - Right side, positioned to flow between LogoCarousel and Blog */}
        <div className="absolute right-[-200px] top-[50%] pointer-events-none z-0">
          <Image
            src="/PropertyBlur.svg"
            alt=""
            width={1200}
            height={1200}
            className="w-[700px] lg:w-[900px] xl:w-[1100px]"
          />
        </div>

        <Hero />
        <Services />
        <NewlyLaunched />
        <LogoCarousel />
        <PropertyExplorer />
        {/* <Blog /> */}
      </div>
    </>
  );
}
