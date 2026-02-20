'use client';

import Image from 'next/image';

const brands = [
  { name: 'ARADA', src: '/BrandLogos/ARADA.svg', invert: false },
  { name: 'DAMAC', src: '/BrandLogos/DAMAC.svg', invert: false },
  { name: 'DEEYAR', src: '/BrandLogos/DEEYAR.svg', invert: false },
  { name: 'Ellington', src: '/BrandLogos/Ellington.svg', invert: false },
  { name: 'OMNIYAT', src: '/BrandLogos/OMNIYAT.svg', invert: false },
  { name: 'ALBARI', src: '/BrandLogos/ALBARI.svg', invert: true },
  { name: 'ALDAR', src: '/BrandLogos/ALDAR.svg', invert: true },
  { name: 'ALHABTOOR', src: '/BrandLogos/ALHABTOOR.svg', invert: true },
  { name: 'AZIZI', src: '/BrandLogos/AZIZI.svg', invert: true },
  { name: 'DUBAI', src: '/BrandLogos/DUBAI.svg', invert: true },
  { name: 'EMAAR', src: '/BrandLogos/EMAAR.svg', invert: true },
  { name: 'NAKHEEL', src: '/BrandLogos/NAKHEEL.svg', invert: true },
  { name: 'SAMANA', src: '/BrandLogos/SAMANA.svg', invert: true },
  { name: 'SOBHA', src: '/BrandLogos/SOBHA.svg', invert: true },
];

export default function LogoCarousel() {
  // Duplicate logos for seamless infinite scroll
  const duplicatedLogos = [...brands, ...brands, ...brands];

  return (
    <section className="bg-black py-0 overflow-hidden">
      <div className="relative">
        {/* Gradient fade on left */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black to-transparent z-10" />
        
        {/* Gradient fade on right */}
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent z-10" />
        
        {/* Scrolling container */}
        <div className="flex animate-scroll">
          {duplicatedLogos.map((logo, index) => (
            <div
              key={`${logo.name}-${index}`}
              className="flex-shrink-0 px-5 flex items-center justify-center h-20"
            >
              <Image
                src={logo.src}
                alt={logo.name}
                width={64}
                height={64}
                className={`h-16 w-auto max-w-max grayscale hover:grayscale-0 transition-all ${
                  logo.invert ? 'invert' : ''
                }`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}