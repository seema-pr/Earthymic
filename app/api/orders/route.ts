import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getToken } from 'next-auth/jwt'

type OrderRequestItem = {
    id: string
    quantity: number
}

type OrderRequestBody = {
    customerName: string
    customerEmail?: string
    customerPhone: string
    addressLine1: string
    addressLine2?: string
    city: string
    state: string
    postalCode: string
    country?: string
    items: OrderRequestItem[]
}


export async function POST(request: Request) {
    try {
        const body: OrderRequestBody = await request.json()
        const token = await getToken({
            req: request as any,
            secret: process.env.NEXTAUTH_SECRET,
        })

        const userId = token?.sub ?? null

        let customer = null

        if (userId) {
            customer = await prisma.customer.findUnique({
                where: {
                    userId,
                },
            })
        }

        console.log('ORDER USER ID:', userId)
        console.log('ORDER CUSTOMER:', customer)
        const {
            customerName,
            customerEmail,
            customerPhone,
            addressLine1,
            addressLine2,
            city,
            state,
            postalCode,
            country,
            items,
        } = body

        // Basic validation
        if (
            !customerName?.trim() ||
            !customerPhone?.trim() ||
            !addressLine1?.trim() ||
            !city?.trim() ||
            !state?.trim() ||
            !postalCode?.trim()
        ) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Please provide all required customer and address details.',
                },
                { status: 400 },
            )
        }

        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Your cart is empty.',
                },
                { status: 400 },
            )
        }

        // Validate quantities
        for (const item of items) {
            if (!item.id || !Number.isInteger(item.quantity) || item.quantity <= 0) {
                return NextResponse.json(
                    {
                        success: false,
                        error: 'Invalid cart item.',
                    },
                    { status: 400 },
                )
            }
        }

        const productIds = items.map((item) => item.id)

        // Get the REAL products and prices from the database
        const products = await prisma.product.findMany({
            where: {
                id: {
                    in: productIds,
                },
                isActive: true,
            },
        })

        // Ensure every requested product exists
        if (products.length !== productIds.length) {
            return NextResponse.json(
                {
                    success: false,
                    error:
                        'One or more products are unavailable. Please refresh your cart.',
                },
                { status: 400 },
            )
        }

        const productMap = new Map(
            products.map((product) => [product.id, product] as const)
        )

        // products.forEach((product: { id: string }) => {
        //     productMap.set(product.id, product)
        // })

        const orderItems = items.map((item) => {
            const product = productMap.get(item.id)

            if (!product) {
                throw new Error(`Product not found: ${item.id}`)
            }

            const price = Number(product.price)
            const total = price * item.quantity

            return {
                productId: product.id,
                productName: product.name,
                productSlug: product.slug,
                productImage: product.image,
                price,
                quantity: item.quantity,
                total,
            }
        })

        const subtotal = orderItems.reduce(
            (sum, item) => sum + item.total,
            0,
        )

        // GST = 18%
        const gstAmount = subtotal * 0.18

        // Free shipping for orders ₹999 or above
        const shippingAmount = subtotal >= 999 ? 0 : 50

        // Final order total
        const totalAmount = subtotal + gstAmount + shippingAmount

        // Generate a readable order number
        const orderNumber = `EAR-${Date.now()}`
        if (customer) {
            const existingAddress = await prisma.customerAddress.findFirst({
                where: {
                    customerId: customer.id,
                    addressLine1: addressLine1.trim(),
                    city: city.trim(),
                    state: state.trim(),
                    postalCode: postalCode.trim(),
                },
            })

            if (!existingAddress) {
                await prisma.customerAddress.create({
                    data: {
                        customerId: customer.id,
                        fullName: customerName.trim(),
                        mobile: customerPhone.trim(),
                        addressLine1: addressLine1.trim(),
                        addressLine2: addressLine2?.trim() || null,
                        city: city.trim(),
                        state: state.trim(),
                        postalCode: postalCode.trim(),
                        country: country?.trim() || 'India',
                        isDefault: true,
                    },
                })
            }
        }
        const order = await prisma.order.create({
            data: {
                orderNumber,
                customerId: customer?.id ?? null,
                customerName: customerName.trim(),
                customerEmail: customerEmail?.trim() || null,
                customerPhone: customerPhone.trim(),

                addressLine1: addressLine1.trim(),
                addressLine2: addressLine2?.trim() || null,
                city: city.trim(),
                state: state.trim(),
                postalCode: postalCode.trim(),
                country: country?.trim() || 'India',

                subtotal,
                gstAmount,
                shippingAmount,
                totalAmount,

                items: {
                    create: orderItems,
                },
            },
            include: {
                items: true,
            },
        })

        return NextResponse.json(
            {
                success: true,
                order: {
                    id: order.id,
                    orderNumber: order.orderNumber,
                    totalAmount: Number(order.totalAmount),
                    status: order.status,
                    paymentStatus: order.paymentStatus,
                },
            },
            { status: 201 },
        )
    } catch (error) {
        console.error('Failed to create order:', error)

        return NextResponse.json(
            {
                success: false,
                error: 'Unable to create order. Please try again.',
            },
            { status: 500 },
        )
    }
}

