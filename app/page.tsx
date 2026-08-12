'use client'

import Hero from '@/components/Hero'
import ProductGrid from '@/components/ProductGrid'
import About from '@/components/About'
import Contact from '@/components/Contact'

export default function Home() {
  return (
    <main>
      <Hero />
      <ProductGrid />
      <About />
      <Contact />
    </main>
  )
}
