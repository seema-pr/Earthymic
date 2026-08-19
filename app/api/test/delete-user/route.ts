import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: Request) {
    try {
        const body = await request.json()

        const email = String(body.email ?? '')
            .trim()
            .toLowerCase()

        if (!email) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Email is required.',
                },
                { status: 400 },
            )
        }

        const user = await prisma.user.findUnique({
            where: {
                email,
            },
            include: {
                customer: true,
            },
        })

        if (!user) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'User not found.',
                },
                { status: 404 },
            )
        }

        await prisma.$transaction(async (tx) => {
            if (user.customer) {
                // Get orders belonging to this customer
                const orders = await tx.order.findMany({
                    where: {
                        customerId: user.customer.id,
                    },
                    select: {
                        id: true,
                    },
                })

                const orderIds = orders.map((order) => order.id)

                // Delete order items first
                if (orderIds.length > 0) {
                    await tx.orderItem.deleteMany({
                        where: {
                            orderId: {
                                in: orderIds,
                            },
                        },
                    })

                    // Delete orders
                    await tx.order.deleteMany({
                        where: {
                            id: {
                                in: orderIds,
                            },
                        },
                    })
                }

                // CustomerAddress records cascade when Customer is deleted
                await tx.customer.delete({
                    where: {
                        id: user.customer.id,
                    },
                })
            }

            // Account and Session records cascade from User
            await tx.user.delete({
                where: {
                    id: user.id,
                },
            })
        })

        return NextResponse.json({
            success: true,
            message: 'User and all related records deleted successfully.',
            email,
        })
    } catch (error) {
        console.error('Delete test user failed:', error)

        return NextResponse.json(
            {
                success: false,
                error: 'Unable to delete user.',
            },
            { status: 500 },
        )
    }
}