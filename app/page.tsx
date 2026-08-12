import Hero from '@/components/Hero'
import ProductGrid from '@/components/ProductGrid'
import About from '@/components/About'
import Contact from '@/components/Contact'
import { prisma } from '@/lib/prisma'

export default async function Home() {
  const dbProducts = await prisma.product.findMany({
    where: {
      isActive: true,
    },
    include: {
      subCategory: {
        include: {
          category: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  })

  // Convert Prisma Decimal and other Prisma values
  // into plain JavaScript values before passing to
  // the Client Component.
  const products = dbProducts.map(
    (product: {
      id: any
      name: any
      slug: any
      label: any
      description: any
      price: any
      image: any
      images: any
      weight: any
      subCategory: { name: any; slug: any; category: { name: any; slug: any } }
    }) => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      label: product.label,
      description: product.description,
      price: Number(product.price),
      image: product.image,
      images: product.images,
      weight: product.weight,
      subCategory: {
        name: product.subCategory.name,
        slug: product.subCategory.slug,
        category: {
          name: product.subCategory.category.name,
          slug: product.subCategory.category.slug,
        },
      },
    }),
  )

  return (
    <main>
      <Hero />

      <ProductGrid products={products} />

      <About />

      <Contact />
    </main>
  )
}
