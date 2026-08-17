import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const items = body.items

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: 'Cart items are required.' },
                { status: 400 },
            )
        }

        for (const item of items) {
            if (
                !item ||
                typeof item.productId !== 'string' ||
                !item.productId.trim() ||
                !Number.isInteger(item.quantity) ||
                item.quantity < 1
            ) {
                return NextResponse.json(
                    { error: 'Invalid cart item.' },
                    { status: 400 },
                )
            }
        }

        const productIds = [
            ...new Set(items.map((item) => item.productId)),
        ]

        const products = await prisma.product.findMany({
            where: {
                id: {
                    in: productIds,
                },
                isActive: true,
            },
        })

        if (products.length !== productIds.length) {
            return NextResponse.json(
                { error: 'One or more products are unavailable.' },
                { status: 400 },
            )
        }

        let subtotal = 0

        for (const item of items) {
            const product = products.find(
                (product) => product.id === item.productId,
            )

            if (!product) {
                return NextResponse.json(
                    { error: 'Product not found.' },
                    { status: 400 },
                )
            }

            subtotal += Number(product.price) * item.quantity
        }

        const gst = subtotal * 0.18
        const shipping = subtotal >= 999 ? 0 : 50

        const totalAmount = subtotal + gst + shipping

        // Razorpay expects INR in paise.
        // Example: ₹2149.96 → 214996 paise.
        const razorpayAmount = Math.round(totalAmount * 100)

        if (razorpayAmount <= 0) {
            return NextResponse.json(
                { error: 'Invalid order amount.' },
                { status: 400 },
            )
        }

        const order = await razorpay.orders.create({
            amount: razorpayAmount,
            currency: 'INR',
            receipt: `earthymic_${Date.now()}`,
        })

        return NextResponse.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
        })
    } catch (error) {
        console.error('Razorpay order creation failed:', error)

        return NextResponse.json(
            {
                error: 'Unable to create Razorpay order',
            },
            {
                status: 500,
            },
        )
    }
}