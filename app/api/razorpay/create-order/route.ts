import { prisma } from '@/lib/prisma'
import { Prisma, OrderStatus, PaymentStatus } from '@prisma/client'
import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { getToken } from 'next-auth/jwt'

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
    addressLine2?: string
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

        // =========================================================
        // 1. VALIDATE CART
        // =========================================================

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                {
                    error: 'Cart items are required.',
                },
                { status: 400 },
            )
        }

        // =========================================================
        // 2. VALIDATE CUSTOMER
        // =========================================================

        if (!customer) {
            return NextResponse.json(
                {
                    error: 'Customer details are required.',
                },
                { status: 400 },
            )
        }

        const fullName = String(customer.fullName ?? '').trim()

        const mobile = String(customer.mobile ?? '').trim()

        const email = String(customer.email ?? '')
            .trim()
            .toLowerCase()

        const address = String(customer.address ?? '').trim()

        const addressLine2 =
            String(customer.addressLine2 ?? '').trim() || null

        const city = String(customer.city ?? '').trim()

        const state = String(customer.state ?? '').trim()

        const country =
            String(customer.country ?? '').trim() || 'India'

        const pinCode = String(customer.pinCode ?? '').trim()

        if (!fullName) {
            return NextResponse.json(
                {
                    error: 'Full name is required.',
                },
                { status: 400 },
            )
        }

        if (!/^[6-9]\d{9}$/.test(mobile)) {
            return NextResponse.json(
                {
                    error: 'Enter a valid 10-digit mobile number.',
                },
                { status: 400 },
            )
        }

        if (!/^\S+@\S+\.\S+$/.test(email)) {
            return NextResponse.json(
                {
                    error: 'Enter a valid email address.',
                },
                { status: 400 },
            )
        }

        if (!address) {
            return NextResponse.json(
                {
                    error: 'Complete address is required.',
                },
                { status: 400 },
            )
        }

        if (
            !city ||
            !state ||
            !country ||
            !/^\d{6}$/.test(pinCode)
        ) {
            return NextResponse.json(
                {
                    error: 'Complete and valid address details are required.',
                },
                { status: 400 },
            )
        }

        // =========================================================
        // 3. VALIDATE CART ITEMS
        // =========================================================

        for (const item of items) {
            if (
                !item ||
                typeof item.productId !== 'string' ||
                !item.productId.trim() ||
                !Number.isInteger(item.quantity) ||
                item.quantity < 1
            ) {
                return NextResponse.json(
                    {
                        error: 'Invalid cart item.',
                    },
                    { status: 400 },
                )
            }
        }

        // =========================================================
        // 4. LOAD PRODUCTS FROM DATABASE
        //
        // Never trust price received from frontend.
        // =========================================================

        const productIds = [
            ...new Set(
                items.map((item) => item.productId.trim()),
            ),
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
                {
                    error: 'One or more products are unavailable.',
                },
                { status: 400 },
            )
        }

        // =========================================================
        // 5. BUILD ORDER ITEMS
        // =========================================================

        let subtotal = 0

        const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] =
            []

        for (const item of items) {
            const product = products.find(
                (product) => product.id === item.productId,
            )

            if (!product) {
                return NextResponse.json(
                    {
                        error: 'Product not found.',
                    },
                    { status: 400 },
                )
            }

            const price = Number(product.price)

            const total = price * item.quantity

            subtotal += total

            orderItems.push({
                product: {
                    connect: {
                        id: product.id,
                    },
                },

                productName: product.name,

                productSlug: product.slug,

                productImage: product.image,

                price: product.price,

                quantity: item.quantity,

                total,
            })
        }

        // =========================================================
        // 6. CALCULATE ORDER TOTALS
        // =========================================================

        const gst = subtotal * 0.18

        const shipping = subtotal >= 999 ? 0 : 50

        const totalAmount = subtotal + gst + shipping

        const razorpayAmount = Math.round(totalAmount * 100)

        if (razorpayAmount <= 0) {
            return NextResponse.json(
                {
                    error: 'Invalid order amount.',
                },
                { status: 400 },
            )
        }

        // =========================================================
        // 7. GET AUTHENTICATED USER
        //
        // Logged-in:
        //     userId = authenticated User.id
        //
        // Guest:
        //     userId = null
        // =========================================================

        const token = await getToken({
            req: request as any,
            secret: process.env.NEXTAUTH_SECRET,
        })

        const userId =
            typeof token?.sub === 'string'
                ? token.sub
                : null

        console.log(
            'RAZORPAY CREATE ORDER USER ID:',
            userId,
        )

        // =========================================================
        // 8. CREATE RAZORPAY ORDER
        //
        // External API operation remains outside Prisma transaction.
        // =========================================================

        const razorpayOrder = await razorpay.orders.create({
            amount: razorpayAmount,
            currency: 'INR',
            receipt: `earthymic_${Date.now()}`,
        })

        // =========================================================
        // 9. DATABASE TRANSACTION
        //
        // Customer
        //      ↓
        // CustomerAddress
        //      ↓
        // Order
        //      ↓
        // OrderItems
        //
        // Any database failure rolls back the complete transaction.
        // =========================================================

        const result = await prisma.$transaction(
            async (tx) => {
                // =====================================================
                // 9.1 FIND / CREATE CUSTOMER
                // =====================================================

                let customerRecord:
                    | Prisma.CustomerGetPayload<{
                        select: {
                            id: true
                            userId: true
                            name: true
                            email: true
                            phone: true
                            createdAt: true
                            updatedAt: true
                        }
                    }>
                    | null = null

                if (userId) {
                    // -------------------------------------------------
                    // LOGGED-IN USER
                    //
                    // Customer identity belongs to the authenticated
                    // User, NOT to the checkout recipient.
                    // -------------------------------------------------

                    customerRecord =
                        await tx.customer.findUnique({
                            where: {
                                userId,
                            },

                            select: {
                                id: true,
                                userId: true,
                                name: true,
                                email: true,
                                phone: true,
                                createdAt: true,
                                updatedAt: true,
                            },
                        })

                    // -------------------------------------------------
                    // User exists but Customer doesn't exist yet.
                    //
                    // IMPORTANT:
                    // We create the Customer against userId.
                    // The delivery recipient is handled separately
                    // by CustomerAddress.
                    // -------------------------------------------------

                    if (!customerRecord) {
                        const authenticatedUser =
                            await tx.user.findUnique({
                                where: {
                                    id: userId,
                                },

                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                },
                            })

                        if (!authenticatedUser) {
                            throw new Error(
                                'Authenticated user was not found.',
                            )
                        }

                        customerRecord =
                            await tx.customer.create({
                                data: {
                                    userId: authenticatedUser.id,

                                    // Customer identity comes from
                                    // authenticated User.
                                    name:
                                        authenticatedUser.name?.trim() ||
                                        fullName,

                                    email:
                                        authenticatedUser.email
                                            ?.trim()
                                            .toLowerCase() ||
                                        email,

                                    phone: mobile,
                                },

                                select: {
                                    id: true,
                                    userId: true,
                                    name: true,
                                    email: true,
                                    phone: true,
                                    createdAt: true,
                                    updatedAt: true,
                                },
                            })
                    }
                } else {
                    // =====================================================
                    // GUEST CUSTOMER
                    // =====================================================
                    // A guest has no authenticated User.
                    //
                    // Reuse an existing guest Customer when the same
                    // email is used again.
                    //
                    // IMPORTANT:
                    // Shipping name/fullName does NOT identify the Customer.
                    // =====================================================

                    customerRecord = await tx.customer.findFirst({
                        where: {
                            userId: null,
                            email: email,
                        },
                    })

                    if (!customerRecord) {
                        customerRecord = await tx.customer.create({
                            data: {
                                userId: null,
                                name: fullName,
                                email,
                                phone: mobile,
                            },
                        })
                    }
                }

                // =====================================================
                // 9.2 FIND OR CREATE CUSTOMER ADDRESS
                // =====================================================

                let customerAddress =
                    await tx.customerAddress.findFirst({
                        where: {
                            customerId:
                                customerRecord.id,

                            addressLine1: address,

                            city,

                            state,

                            postalCode: pinCode,
                        },
                    })

                if (!customerAddress) {
                    // -------------------------------------------------
                    // CREATE NEW ADDRESS
                    //
                    // fullName = DELIVERY RECIPIENT
                    // mobile   = DELIVERY CONTACT
                    //
                    // These do NOT have to match User.name.
                    // -------------------------------------------------

                    customerAddress =
                        await tx.customerAddress.create({
                            data: {
                                customerId:
                                    customerRecord.id,

                                fullName,

                                mobile,

                                addressLine1:
                                    address,

                                addressLine2,

                                city,

                                state,

                                postalCode:
                                    pinCode,

                                country,

                                isDefault: true,
                            },
                        })
                } else {
                    // -------------------------------------------------
                    // EXISTING ADDRESS
                    //
                    // The recipient may change even when the physical
                    // address remains the same.
                    // -------------------------------------------------

                    customerAddress =
                        await tx.customerAddress.update({
                            where: {
                                id: customerAddress.id,
                            },

                            data: {
                                fullName,

                                mobile,

                                addressLine2,

                                country,

                                isDefault: true,
                            },
                        })
                }

                // =====================================================
                // 9.3 CREATE ORDER
                //
                // Order stores a HISTORICAL SNAPSHOT.
                //
                // customerName
                //     <- CustomerAddress.fullName
                //
                // customerPhone
                //     <- CustomerAddress.mobile
                //
                // address fields
                //     <- CustomerAddress
                //
                // customerEmail
                //     <- checkout email
                // =====================================================

                const order =
                    await tx.order.create({
                        data: {
                            orderNumber: `EYM-${Date.now()}`,

                            customerId:
                                customerRecord.id,

                            // -------------------------------------------------
                            // DELIVERY SNAPSHOT
                            // -------------------------------------------------

                            customerName:
                                customerAddress.fullName,

                            customerEmail: email,

                            customerPhone:
                                customerAddress.mobile,

                            addressLine1:
                                customerAddress.addressLine1,

                            addressLine2:
                                customerAddress.addressLine2,

                            city:
                                customerAddress.city,

                            state:
                                customerAddress.state,

                            postalCode:
                                customerAddress.postalCode,

                            country:
                                customerAddress.country,

                            // -------------------------------------------------
                            // AMOUNTS
                            // -------------------------------------------------

                            subtotal,

                            gstAmount: gst,

                            shippingAmount:
                                shipping,

                            totalAmount,

                            // -------------------------------------------------
                            // STATUS
                            // -------------------------------------------------

                            status:
                                OrderStatus.PENDING,

                            paymentStatus:
                                PaymentStatus.PENDING,

                            paymentOrderId:
                                razorpayOrder.id,

                            // -------------------------------------------------
                            // ORDER ITEMS
                            // -------------------------------------------------

                            items: {
                                create: orderItems,
                            },
                        },

                        include: {
                            items: true,
                        },
                    })

                // =====================================================
                // 9.4 RETURN TRANSACTION RESULT
                // =====================================================

                return {
                    customer:
                        customerRecord,

                    customerAddress,

                    order,
                }
            },
        )

        // =========================================================
        // 10. RESPONSE
        // =========================================================

        return NextResponse.json({
            id: razorpayOrder.id,

            amount: razorpayOrder.amount,

            currency: razorpayOrder.currency,

            orderId: result.order.id,

            customerId:
                result.customer.id,

            customerAddressId:
                result.customerAddress.id,
        })
    } catch (error) {
        console.error(
            'Razorpay order creation failed:',
            error,
        )

        const message =
            error instanceof Error
                ? error.message
                : 'Unknown error'

        return NextResponse.json(
            {
                error: message,
            },
            {
                status: 500,
            },
        )
    }
}