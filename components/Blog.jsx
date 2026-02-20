import Image from 'next/image';

export default function Blog() {
  const blogPosts = [
    {
      id: 1,
      title: 'Lorem ipsum dolor sit amet, consectetur adipiscing e',
      excerpt:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      image: '/blog-burj.webp',
      imageAlt: 'Burj Al Arab hotel in Dubai',
      layout: 'right', // image on right
    },
    {
      id: 2,
      title: 'Lorem ipsum dolor sit amet, consectetur adipiscing e',
      excerpt:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      image: '/blog-building.webp',
      imageAlt: 'Modern yellow building',
      layout: 'left', // image on left
    },
  ];

  return (
    <section className="relative bg-transparent py-20 md:py-28">
      <div className="relative max-w-7xl mx-auto px-6">
        {/* Section Title */}
        <h2 className="text-white text-3xl md:text-4xl font-semibold mb-16 md:mb-20">
          Blogs and News
        </h2>

        {/* Blog Posts */}
        <div className="space-y-20 md:space-y-28">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className={`flex flex-col gap-8 md:gap-12 ${
                post.layout === 'right'
                  ? 'md:flex-row'
                  : 'md:flex-row-reverse'
              }`}
            >
              {/* Text Content */}
              <div className="flex-1 flex flex-col justify-center">
                <h3 className="text-white text-xl md:text-2xl font-semibold mb-4 md:mb-6">
                  {post.title}
                </h3>
                <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-6 md:mb-8">
                  {post.excerpt}
                </p>
                <div>
                  <button className="bg-gradient-to-r from-[#253F94] to-[#001C79] hover:from-[#1e3580] hover:to-[#001565] text-white text-sm font-medium px-6 py-2.5 rounded transition-all">
                    Read More
                  </button>
                </div>
              </div>

              {/* Image */}
              <div className="flex-1">
                <div className="relative w-full aspect-[4/3] md:aspect-[5/4] rounded-lg overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.imageAlt}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    priority={post.id === 1}
                    loading={post.id === 1 ? undefined : "lazy"}
                  />
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
