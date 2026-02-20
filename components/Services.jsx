import React from 'react';
import Image from 'next/image';

const ServiceCard = ({ icon, title, description }) => {
  return (
    <div className="relative group h-full">
      {/* Gradient border wrapper */}
      <div className="h-full rounded-2xl p-[1px] bg-gradient-to-br from-white/50 via-white/5 to-white/50">
        {/* Inner card - solid dark background */}
        <div className="h-full rounded-2xl bg-[#0a0f18] p-8 transition-all duration-300">
          {/* Content */}
          <div className="relative z-10">
            {/* Icon container */}
            <div className="w-14 h-14 bg-[#1a2535] rounded-xl flex items-center justify-center mb-6 border border-white/10 overflow-hidden">
              <Image
                src={icon}
                alt={title}
                width={56}
                height={56}
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* Title */}
            <h3 className="text-white text-lg font-semibold mb-3">
              {title}
            </h3>
            
            {/* Description */}
            <p className="text-gray-300 text-base leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const services = [
  {
    icon: "/ServiceLogos/Brokerage.svg",
    title: "Property Brokerage",
    description: "Off-plan, secondary, and rental properties across the UAE."
  },
  {
    icon: "/ServiceLogos/Consultancy.svg",
    title: "Investment Consultancy",
    description: "Customized investment roadmaps that deliver passive income"
  },
  {
    icon: "/ServiceLogos/Management.svg",
    title: "Property Management",
    description: "Full management services to protect and grow your assets."
  },
  {
    icon: "/ServiceLogos/Mortgage.svg",
    title: "Mortgage Assistance",
    description: "Best financial solutions through trusted partners."
  },
  {
    icon: "/ServiceLogos/GlobalREandVisa.svg",
    title: "Global Real Estate",
    description: "Secure investment opportunities beyond the UAE."
  },
  {
    icon: "/ServiceLogos/GlobalREandVisa.svg",
    title: "Golden Visa & Residency",
    description: "End-to-end support for UAE investor residency."
  },
  {
    icon: "/ServiceLogos/REMarketing.svg",
    title: "Real Estate Marketing",
    description: "Modern property marketing for developers and owners."
  }
];

export default function Services() {
  return (
    <section className="relative bg-transparent pt-64 pb-20 px-4">
      {/* Services Blur Effect - Left side */}
      <div className="absolute left-[-200px] top-1/2 -translate-y-1/2 pointer-events-none">
        <Image
          src="/ServicesBlur.svg"
          alt=""
          width={800}
          height={800}
          className="w-[500px] h-auto lg:w-[700px] xl:w-[800px] opacity-70"
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Title */}
        <h2 className="text-white text-3xl md:text-4xl font-semibold mb-12">
          Our Services
        </h2>

        {/* Services Grid - First row (4 cards with col-span-3 each in 12-col grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5">
          {services.slice(0, 4).map((service, index) => (
            <div key={index} className="lg:col-span-3">
              <ServiceCard
                icon={service.icon}
                title={service.title}
                description={service.description}
              />
            </div>
          ))}
        </div>

        {/* Services Grid - Second row (3 cards with col-span-4 each in 12-col grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-5 mt-5">
          {services.slice(4, 7).map((service, index) => (
            <div key={index + 4} className="lg:col-span-4">
              <ServiceCard
                icon={service.icon}
                title={service.title}
                description={service.description}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
