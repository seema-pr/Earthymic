import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

type CheckoutItem = {
    productId: string
    quantity: number
}

type CheckoutCustomer = {
    fullName: string
    mobile: string
    email: string
    address: string
    city: string
    state: string
    country: string
    pinCode: string
}

export async function POST(request: Request) {
    try {
        const body = await request.json()

        const items = body.items as CheckoutItem[]
        const customer = body.customer as CheckoutCustomer

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                { error: 'Cart items are required.' },
                { status: 400 },
            )
        }

        if (!customer) {
            return NextResponse.json(
                { error: 'Customer details are required.' },
                { status: 400 },
            )
        }

        const fullName = String(customer.fullName ?? '').trim()
        const mobile = String(customer.mobile ?? '').trim()
        const email = String(customer.email ?? '').trim().toLowerCase()
        const address = String(customer.address ?? '').trim()
        const city = String(customer.city ?? '').trim()
        const state = String(customer.state ?? '').trim()
        const country = String(customer.country ?? '').trim()
        const pinCode = String(customer.pinCode ?? '').trim()

        if (!fullName) {
            return NextResponse.json(
                { error: 'Full name is required.' },
                { status: 400 },
            )
        }

        if (!/^[6-9]\d{9}$/.test(mobile)) {
            return NextResponse.json(
                { error: 'Enter a valid 10-digit mobile number.' },
                { status: 400 },
            )
        }

        if (!/^\S+@\S+\.\S+$/.test(email)) {
            return NextResponse.json(
                { error: 'Enter a valid email address.' },
                { status: 400 },
            )
        }

        if (!address) {
            return NextResponse.json(
                { error: 'Complete address is required.' },
                { status: 400 },
            )
        }

        if (!city || !state || !country || !/^\d{6}$/.test(pinCode)) {
            return NextResponse.json(
                { error: 'Complete and valid address details are required.' },
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

        const orderItems = []

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

            const price = Number(product.price)
            const total = price * item.quantity

            subtotal += total

            orderItems.push({
                productId: product.id,
                productName: product.name,
                productSlug: product.slug,
                productImage: product.image,
                price: product.price,
                quantity: item.quantity,
                total,
            })
        }

        const gst = subtotal * 0.18
        const shipping = subtotal >= 999 ? 0 : 50
        const totalAmount = subtotal + gst + shipping

        const razorpayAmount = Math.round(totalAmount * 100)

        if (razorpayAmount <= 0) {
            return NextResponse.json(
                { error: 'Invalid order amount.' },
                { status: 400 },
            )
        }

        /*
         * Create Razorpay order first.
         */
        const razorpayOrder = await razorpay.orders.create({
            amount: razorpayAmount,
            currency: 'INR',
            receipt: `earthymic_${Date.now()}`,
        })

        /*
         * Create Earthymic order in PENDING state.
         *
         * customerId remains null for now so guest checkout
         * continues to work. We'll connect authenticated
         * customers separately.
         */
        const order = await prisma.order.create({
            data: {
                orderNumber: `EYM-${Date.now()}`,

                customerName: fullName,
                customerEmail: email,
                customerPhone: mobile,

                addressLine1: address,
                city,
                state,
                postalCode: pinCode,
                country,

                subtotal,
                gstAmount: gst,
                shippingAmount: shipping,
                totalAmount,

                status: 'PENDING',
                paymentStatus: 'PENDING',

                paymentOrderId: razorpayOrder.id,

                items: {
                    create: orderItems,
                },
            },
        })

        return NextResponse.json({
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            orderId: order.id,
        })
    } catch (error) {
        console.error('Razorpay order creation failed:', error)

        return NextResponse.json(
            {
                error: 'Unable to create payment order.',
            },
            {
                status: 500,
            },
        )
    }
}