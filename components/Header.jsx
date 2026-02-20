'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Explore', href: '/explore' },
  { label: 'About Us', href: '/about' },
  { label: 'Properties', href: '/properties' },
  { label: 'Developers', href: '/developers' },
];

export default function Header() {
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const heroHeight = window.innerHeight; // Approximate hero section height
    
    const onScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Always show navbar in hero section
      if (currentScrollY < heroHeight) {
        setVisible(true);
      } else {
        // Below hero: show only when scrolling up
        if (currentScrollY < lastScrollY) {
          setVisible(true);
        } else {
          setVisible(false);
        }
      }
      
      setLastScrollY(currentScrollY);
    };
    
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [lastScrollY]);

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        visible ? 'translate-y-0' : '-translate-y-full'
      } ${lastScrollY > 20 ? 'bg-black/30 backdrop-blur-sm' : 'bg-transparent'}`}
    >
      <div className="w-full flex items-center justify-between px-8 lg:px-16 xl:px-24 py-5">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/Logo.svg"
            alt="Apex Abu Dhabi"
            width={53}
            height={37}
            className="h-9 w-auto -mt-3"
            priority
          />
        </Link>

        {/* Navigation Links - Desktop */}
        <nav className="hidden md:flex items-center gap-10 lg:gap-20">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-[18px] font-thin transition-colors ${
                router.pathname === link.href
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Contact Button - Desktop with Gradient */}
        <a
          href="#contact-form"
          className="hidden md:inline-flex items-center justify-center bg-gradient-to-r from-[#253F94] to-[#001C79] hover:from-[#1e3580] hover:to-[#001565] text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-all"
        >
          Contact Us
        </a>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white p-2 -mr-2"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black/90 backdrop-blur-md">
          <nav className="flex flex-col px-6 py-4 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`text-base font-medium py-2 transition-colors ${
                  router.pathname === link.href
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="#contact-form"
              onClick={() => setMobileMenuOpen(false)}
              className="inline-flex items-center justify-center text-white font-semibold px-5 py-3 rounded-lg transition-all mt-2"
            >
              Contact Us
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
