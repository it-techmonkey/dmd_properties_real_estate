'use client';

import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import Header from '../components/Header';

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About Us | DMD</title>
        <meta
          name="description"
          content="Learn about DMD - UAE's premier real estate agency helping you find your dream property."
        />
      </Head>

      <div className="min-h-screen bg-black overflow-x-hidden">
        <Header />
        
        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-6 lg:px-12 xl:px-20">
          {/* Background blur */}
          <div className="absolute right-0 top-0 pointer-events-none z-0 opacity-50">
            <Image
              src="/HeroBlur.svg"
              alt=""
              width={800}
              height={800}
              className="w-[500px] lg:w-[700px] translate-x-1/3"
            />
          </div>
          
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center">
              <span className="inline-block px-4 py-2 bg-white/5 border border-white/10 rounded-full text-amber-400 text-sm font-medium mb-6">
                About Us
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
                Your Trusted Partner in
                <br />
                <span className="bg-gradient-to-r from-[#253F94] to-[#6B8DD6] bg-clip-text text-transparent">
                  UAE Real Estate
                </span>
              </h1>
              <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                With years of experience in the UAE property market, we help clients find their perfect homes and investment opportunities.
              </p>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 px-6 lg:px-12 xl:px-20">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Image */}
              <div className="relative h-[400px] rounded-2xl overflow-hidden">
                <img
                  src="/Properties/2.webp"
                  alt="Luxury property"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              </div>
              
              {/* Content */}
              <div>
                <h2 className="text-3xl font-bold text-white mb-6">Our Story</h2>
                <p className="text-gray-400 mb-4">
                  Founded with a vision to transform the real estate experience in UAE, we have grown to become one of the most trusted names in the industry.
                </p>
                <p className="text-gray-400 mb-4">
                  We believe that finding a home should be an exciting journey, not a stressful task. Our dedicated team of experts works tirelessly to match you with properties that fit your lifestyle and aspirations.
                </p>
                <p className="text-gray-400">
                  From luxury villas on Palm Jumeirah to modern apartments in Downtown Dubai, we have access to the finest properties the city has to offer.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-16 px-6 lg:px-12 xl:px-20">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-white text-center mb-10">Our Values</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  ),
                  title: 'Trust & Integrity',
                  description: 'We build lasting relationships through transparency and honest communication with every client.',
                },
                {
                  icon: (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                  ),
                  title: 'Excellence',
                  description: 'We strive for excellence in every interaction, ensuring you receive the best service possible.',
                },
                {
                  icon: (
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  ),
                  title: 'Client First',
                  description: 'Your needs and goals are our priority. We listen, understand, and deliver results.',
                },
              ].map((value, index) => (
                <div key={index} className="p-6 bg-[#0a0a0a] border border-white/10 rounded-xl text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#253F94] to-[#001C79] rounded-xl text-white mb-4">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{value.title}</h3>
                  <p className="text-gray-400 text-sm">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 lg:px-12 xl:px-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Find Your Dream Property?
            </h2>
            <p className="text-gray-400 mb-8 max-w-xl mx-auto">
              Let our expert team guide you through UAE's finest real estate opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/properties"
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-[#253F94] to-[#001C79] rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
              >
                Browse Properties
              </Link>
              <a
                href="/#contact-form"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/5 border border-white/20 rounded-xl text-white font-semibold hover:bg-white/10 transition-colors"
              >
                Contact Us
              </a>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
