import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
    try {
        const products = await prisma.product.findMany({
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
                name: 'asc',
            },
        })

        return NextResponse.json({
            success: true,
            count: products.length,
            products,
        })
    } catch (error) {
        console.error('Database connection error:', error)

        return NextResponse.json(
            {
                success: false,
                error: 'Database connection failed',
            },
            { status: 500 }
        )
    }
}