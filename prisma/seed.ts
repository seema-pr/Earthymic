import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
    throw new Error('DATABASE_URL is not defined')
}

const adapter = new PrismaPg({
    connectionString,
})

const prisma = new PrismaClient({
    adapter,
})

async function main() {
    // ---------------------------------------
    // 1. Categories
    // ---------------------------------------

    const categories = [
        {
            name: 'Wellness',
            slug: 'wellness',
            description: 'Natural, herbal and wellness products.',
            isActive: true,
            subCategories: [
                {
                    name: 'Hair',
                    slug: 'hair',
                    description: 'Natural products for hair care.',
                },
                {
                    name: 'Skin',
                    slug: 'skin',
                    description: 'Natural products for skin care.',
                },
                {
                    name: 'General Wellness',
                    slug: 'general-wellness',
                    description: 'Products for everyday wellness.',
                },
            ],
        },
        {
            name: 'Food',
            slug: 'food',
            description: 'Food and natural food products.',
            isActive: false,
            subCategories: [
                {
                    name: 'Spices',
                    slug: 'spices',
                    description: 'Natural spices and seasoning products.',
                },
                {
                    name: 'Snacks',
                    slug: 'snacks',
                    description: 'Natural and traditional snacks.',
                },
            ],
        },
        {
            name: 'Clothing',
            slug: 'clothing',
            description: 'Clothing products.',
            isActive: false,
            subCategories: [
                {
                    name: "Men's Clothing",
                    slug: 'mens-clothing',
                    description: 'Clothing products for men.',
                },
                {
                    name: "Women's Clothing",
                    slug: 'womens-clothing',
                    description: 'Clothing products for women.',
                },
            ],
        },
        {
            name: 'Apparel',
            slug: 'apparel',
            description: 'Apparel and accessories.',
            isActive: false,
            subCategories: [
                {
                    name: 'Accessories',
                    slug: 'accessories',
                    description: 'Apparel accessories.',
                },
            ],
        },
    ]

    // ---------------------------------------
    // 2. Create categories/subcategories
    // ---------------------------------------

    const subCategoryMap: Record<string, string> = {}

    for (const categoryData of categories) {
        const category = await prisma.category.upsert({
            where: {
                slug: categoryData.slug,
            },
            update: {
                name: categoryData.name,
                description: categoryData.description,
                isActive: categoryData.isActive,
            },
            create: {
                name: categoryData.name,
                slug: categoryData.slug,
                description: categoryData.description,
                isActive: categoryData.isActive,
            },
        })

        for (const subCategoryData of categoryData.subCategories) {
            const subCategory = await prisma.subCategory.upsert({
                where: {
                    slug: subCategoryData.slug,
                },
                update: {
                    name: subCategoryData.name,
                    description: subCategoryData.description,
                    categoryId: category.id,
                    isActive: true,
                },
                create: {
                    name: subCategoryData.name,
                    slug: subCategoryData.slug,
                    description: subCategoryData.description,
                    categoryId: category.id,
                    isActive: true,
                },
            })

            subCategoryMap[subCategory.slug] = subCategory.id
        }
    }

    // ---------------------------------------
    // 3. Products
    // ---------------------------------------

    const products = [
        {
            id: 'amla-powder',
            name: 'Amla Powder',
            slug: 'amla-powder',
            label: 'AMLA',
            price: 243,
            description:
                'Traditional amla powder for everyday natural routines.',
            image: '/assets/products/amla.png',
            images: ['/assets/products/amla.png'],
            weight: '200g',
            subCategory: 'general-wellness',
        },
        {
            id: 'ashwagandha-powder',
            name: 'Ashwagandha Powder',
            slug: 'ashwagandha-powder',
            label: 'ASHWAGANDHA',
            price: 249,
            description:
                'Traditional botanical powder for wellness routines.',
            image: '/assets/products/ashwagandha.png',
            images: ['/assets/products/ashwagandha.png'],
            weight: '200g',
            subCategory: 'general-wellness',
        },
        {
            id: 'bhringraj-powder',
            name: 'Bhringraj Powder',
            slug: 'bhringraj-powder',
            label: 'BHRINGRAJ',
            price: 229,
            description:
                'A classic botanical for traditional hair-care routines.',
            image: '/assets/products/bhringraj.png',
            images: ['/assets/products/bhringraj.png'],
            weight: '200g',
            subCategory: 'hair',
        },
        {
            id: 'hibiscus-flower',
            name: 'Hibiscus Flower',
            slug: 'hibiscus-flower',
            label: 'HIBISCUS',
            price: 219,
            description:
                'Dried hibiscus botanical for traditional beauty routines.',
            image: '/assets/products/hibiscus.png',
            images: ['/assets/products/hibiscus.png'],
            weight: '200g',
            subCategory: 'skin',
        },
        {
            id: 'rosemary-leaves',
            name: 'Rosemary Leaves',
            slug: 'rosemary-leaves',
            label: 'ROSEMARY',
            price: 199,
            description:
                'Aromatic rosemary leaves for herbal routines.',
            image: '/assets/products/rosemary.png',
            images: ['/assets/products/rosemary.png'],
            weight: '200g',
            subCategory: 'hair',
        },
        {
            id: 'shikakai-powder',
            name: 'Shikakai Powder',
            slug: 'shikakai-powder',
            label: 'SHIKAKAI',
            price: 189,
            description:
                'Traditional botanical powder for natural hair cleansing.',
            image: '/assets/products/shikakai.png',
            images: ['/assets/products/shikakai.png'],
            weight: '200g',
            subCategory: 'hair',
        },
        {
            id: 'reetha-whole',
            name: 'Reetha Whole',
            slug: 'reetha-whole',
            label: 'REETHA',
            price: 199,
            description:
                'Soapnut fruit traditionally used as a natural cleanser.',
            image: '/assets/products/reetha.png',
            images: ['/assets/products/reetha.png'],
            weight: '200g',
            subCategory: 'hair',
        },
        {
            id: 'tulsi-leaves',
            name: 'Tulsi Leaves',
            slug: 'tulsi-leaves',
            label: 'TULSI',
            price: 189,
            description:
                'Freshly dried tulsi leaves for everyday herbal routines.',
            image: '/assets/products/tulsi.png',
            images: ['/assets/products/tulsi.png'],
            weight: '200g',
            subCategory: 'general-wellness',
        },
        {
            id: 'brahmi-powder',
            name: 'Brahmi Powder',
            slug: 'brahmi-powder',
            label: 'BRAHMI',
            price: 219,
            description:
                'Traditional brahmi powder for natural routines.',
            image: '/assets/products/brahmi.png',
            images: ['/assets/products/brahmi.png'],
            weight: '200g',
            subCategory: 'general-wellness',
        },
        {
            id: 'multani-mitti-powder',
            name: 'Multani Mitti Powder',
            slug: 'multani-mitti-powder',
            label: 'MULTANI MITTI',
            price: 179,
            description:
                'Traditional mineral-rich earth powder for natural care.',
            image: '/assets/products/multani.png',
            images: ['/assets/products/multani.png'],
            weight: '200g',
            subCategory: 'skin',
        },
    ]

    // ---------------------------------------
    // 4. Insert/update products
    // ---------------------------------------

    for (const productData of products) {
        const subCategoryId = subCategoryMap[productData.subCategory]

        if (!subCategoryId) {
            throw new Error(
                `SubCategory not found: ${productData.subCategory}`
            )
        }

        await prisma.product.upsert({
            where: {
                slug: productData.slug,
            },
            update: {
                name: productData.name,
                label: productData.label,
                description: productData.description,
                price: productData.price,
                image: productData.image,
                images: productData.images,
                weight: productData.weight,
                subCategoryId,
                isActive: true,
            },
            create: {
                id: productData.id,
                name: productData.name,
                slug: productData.slug,
                label: productData.label,
                description: productData.description,
                price: productData.price,
                image: productData.image,
                images: productData.images,
                weight: productData.weight,
                subCategoryId,
                isActive: true,
            },
        })
    }

    console.log('Categories seeded successfully.')
    console.log('Subcategories seeded successfully.')
    console.log('10 products seeded successfully.')
}

main()
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })