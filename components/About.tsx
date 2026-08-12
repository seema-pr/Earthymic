export default function About() {
  const pillars = [
    {
      title: 'Pure & Natural',
      description:
        'Every product is sourced from traditional botanicals, free from synthetic additives.',
    },
    {
      title: 'Rooted in Tradition',
      description:
        'Recipes drawn from time-tested herbal practices, prepared with care.',
    },
    {
      title: 'Sustainably Made',
      description:
        'Responsibly sourced ingredients, packaged with the planet in mind.',
    },
  ]

  return (
    <section id="about" className="bg-[#f8f6f0] px-5 py-20 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Heading */}
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
            Our Story
          </p>

          <h2 className="text-3xl font-medium tracking-tight text-stone-900 sm:text-4xl">
            About Earthymic
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-stone-500">
            Earthymic brings pure, traditional herbs into everyday routines.
            We believe in simple ingredients, honest sourcing, and natural
            living passed down through generations.
          </p>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {pillars.map((pillar) => (
            <div
              key={pillar.title}
              className="rounded-2xl bg-white p-6 text-center shadow-sm"
            >
              <h3 className="text-lg font-medium text-[#173b25]">
                {pillar.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-stone-500">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
