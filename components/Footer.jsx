import ContactForm from './ContactForm';
import Link from 'next/link';

export default function Footer() {
  return (
    <>
      {/* Contact Form Section */}
      <ContactForm />
      
      {/* Footer Section */}
      <footer className="bg-black text-white font-jakarta">
        {/* Main Footer Content */}
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-20">
            {/* Logo & Company Info - Left Side */}
            <div className="flex-shrink-0 lg:max-w-xs">
              <Link href="/" className="inline-block mb-6">
                <img 
                  src="/Logo.svg" 
                  alt="DMD Logo" 
                  className="h-10 w-auto"
                />
              </Link>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">
                Your trusted partner in UAE Real Estate. We help you find, invest, and manage premium properties across the UAE.
              </p>
              {/* Social Icons */}
              <div className="flex items-center gap-4">
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                  aria-label="Twitter"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                  aria-label="LinkedIn"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-colors duration-200"
                  aria-label="Instagram"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Links Grid */}
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-10">
              {/* Quick Links */}
              <div>
                <h3 className="text-white font-semibold text-sm mb-5 tracking-wide uppercase">
                  Quick Links
                </h3>
                <ul className="space-y-3">
                  <li>
                    <Link href="/" className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      Home
                    </Link>
                  </li>
                  <li>
                    <Link href="/explore" className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      Explore
                    </Link>
                  </li>
                  <li>
                    <Link href="/properties" className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      Properties
                    </Link>
                  </li>
                  <li>
                    <Link href="/developers" className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      Developers
                    </Link>
                  </li>
                  <li>
                    <Link href="/about" className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      About Us
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Services */}
              <div>
                <h3 className="text-white font-semibold text-sm mb-5 tracking-wide uppercase">
                  Services
                </h3>
                <ul className="space-y-3">
                  <li>
                    <span className="text-gray-400 text-sm">Property Brokerage</span>
                  </li>
                  <li>
                    <span className="text-gray-400 text-sm">Investment Consultancy</span>
                  </li>
                  <li>
                    <span className="text-gray-400 text-sm">Property Management</span>
                  </li>
                  <li>
                    <span className="text-gray-400 text-sm">Mortgage Assistance</span>
                  </li>
                  <li>
                    <span className="text-gray-400 text-sm">Golden Visa Support</span>
                  </li>
                </ul>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="text-white font-semibold text-sm mb-5 tracking-wide uppercase">
                  Contact Us
                </h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-gray-400 text-sm">
                      Dubai Silicon Oasis - Donna Tower - 1505
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <a href="mailto:info@dmdrealestate.ae" className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      info@dmdrealestate.ae
                    </a>
                  </li>
                  <li className="flex items-center gap-3">
                    <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <a href="tel:+971585080082" className="text-gray-400 text-sm hover:text-white transition-colors duration-200">
                      +971 58 508 0082
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-500 text-sm">
                © 2025 DMD. All rights reserved.
              </p>
              <div className="flex items-center gap-6">
                <a href="#" className="text-gray-500 text-sm hover:text-white transition-colors duration-200">
                  Privacy Policy
                </a>
                <a href="#" className="text-gray-500 text-sm hover:text-white transition-colors duration-200">
                  Terms of Service
                </a>
                <Link href="/admin/login" className="text-gray-500 text-sm hover:text-white transition-colors duration-200">
                  Admin
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
