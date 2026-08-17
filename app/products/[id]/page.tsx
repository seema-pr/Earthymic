import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ProductDetailsClient from './ProductDetailsClient'

type ProductDetailsPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function ProductDetailsPage({
  params,
}: ProductDetailsPageProps) {
  const { id } = await params

  const product = await prisma.product.findUnique({
    where: {
      slug: id,
    },
  })

  if (!product || !product.isActive) {
    notFound()
  }

  const serializedProduct = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    label: product.label,
    price: Number(product.price),
    description: product.description,
    image: product.image,
    images: product.images,
    weight: product.weight,
  }

  return <ProductDetailsClient product={serializedProduct} />
}
