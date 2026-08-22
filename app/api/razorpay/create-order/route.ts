import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
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

        // ---------------------------------------------------------
        // VALIDATE CART
        // ---------------------------------------------------------

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json(
                {
                    error: 'Cart items are required.',
                },
                { status: 400 },
            )
        }

        // ---------------------------------------------------------
        // VALIDATE CUSTOMER
        // ---------------------------------------------------------

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
        const email = String(customer.email ?? '').trim().toLowerCase()
        const address = String(customer.address ?? '').trim()
        const addressLine2 = String(customer.addressLine2 ?? '').trim() || null
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

        // ---------------------------------------------------------
        // VALIDATE CART ITEMS
        // ---------------------------------------------------------

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

        // ---------------------------------------------------------
        // LOAD PRODUCTS FROM DATABASE
        //
        // Never trust product price from frontend.
        // ---------------------------------------------------------

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
                {
                    error: 'One or more products are unavailable.',
                },
                { status: 400 },
            )
        }

        // ---------------------------------------------------------
        // BUILD ORDER ITEMS
        //
        // Explicit Prisma type fixes TS7034 / TS7005.
        // ---------------------------------------------------------

        let subtotal = 0

        const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] = []

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

        // ---------------------------------------------------------
        // CALCULATE ORDER TOTALS
        // ---------------------------------------------------------

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

        // ---------------------------------------------------------
        // GET LOGGED-IN USER
        //
        // Logged-in:
        //   userId = authenticated User.id
        //
        // Guest:
        //   userId = null
        // ---------------------------------------------------------

        const token = await getToken({
            req: request as any,
            secret: process.env.NEXTAUTH_SECRET,
        })

        const userId = token?.sub ?? null

        console.log(
            'RAZORPAY CREATE ORDER USER ID:',
            userId,
        )

        // ---------------------------------------------------------
        // CREATE RAZORPAY ORDER
        //
        // External operation must stay outside the Prisma
        // database transaction.
        // ---------------------------------------------------------

        const razorpayOrder = await razorpay.orders.create({
            amount: razorpayAmount,
            currency: 'INR',
            receipt: `earthymic_${Date.now()}`,
        })

        // ---------------------------------------------------------
        // DATABASE TRANSACTION
        //
        // Customer
        //      ↓
        // CustomerAddress
        //      ↓
        // Order
        //      ↓
        // OrderItems
        //
        // If any database operation fails, everything rolls back.
        // ---------------------------------------------------------

        const result = await prisma.$transaction(async (tx) => {
            // =======================================================
            // 1. FIND OR CREATE CUSTOMER
            // =======================================================

            let customerRecord

            if (userId) {
                // -----------------------------------------------------
                // LOGGED-IN CUSTOMER
                // -----------------------------------------------------

                customerRecord = await tx.customer.findUnique({
                    where: {
                        userId,
                    },
                })

                // -----------------------------------------------------
                // Logged-in user may exist without a Customer record.
                // Create the Customer in that case.
                // -----------------------------------------------------

                if (!customerRecord) {
                    customerRecord = await tx.customer.create({
                        data: {
                            userId,
                            name: fullName,
                            email,
                            phone: mobile,
                        },
                    })
                } else {
                    // ---------------------------------------------------
                    // Update customer profile.
                    //
                    // IMPORTANT:
                    // This is NOT used as the delivery recipient source.
                    // Delivery name comes from CustomerAddress.fullName.
                    // ---------------------------------------------------

                    customerRecord = await tx.customer.findUnique({
                        where: {
                            userId,
                        },
                    })

                    if (!customerRecord) {
                        customerRecord = await tx.customer.create({
                            data: {
                                userId,
                                name: fullName,
                                email,
                                phone: mobile,
                            },
                        })
                    }
                }
            } else {
                // -----------------------------------------------------
                // GUEST CUSTOMER
                //
                // A guest still gets a Customer record.
                //
                // userId remains NULL.
                // -----------------------------------------------------

                customerRecord = await tx.customer.create({
                    data: {
                        userId: null,
                        name: fullName,
                        email,
                        phone: mobile,
                    },
                })
            }

            // =======================================================
            // 2. CREATE / FIND CUSTOMER ADDRESS
            // =======================================================

            let customerAddress =
                await tx.customerAddress.findFirst({
                    where: {
                        customerId: customerRecord.id,
                        addressLine1: address,
                        city,
                        state,
                        postalCode: pinCode,
                    },
                })

            if (!customerAddress) {
                customerAddress =
                    await tx.customerAddress.create({
                        data: {
                            customerId: customerRecord.id,

                            // IMPORTANT:
                            // Delivery recipient name is stored here.
                            // It does NOT come from User.name.
                            fullName,

                            // Delivery mobile
                            mobile,

                            addressLine1: address,
                            addressLine2,
                            city,
                            state,
                            postalCode: pinCode,
                            country,

                            isDefault: true,
                        },
                    })
            } else {
                // -----------------------------------------------------
                // Existing address.
                //
                // Update recipient information because the person
                // receiving the order may be different from the
                // previously saved recipient.
                // -----------------------------------------------------

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

            // =======================================================
            // 3. CREATE ORDER
            //
            // The Order is a historical snapshot.
            //
            // customerName  <- CustomerAddress.fullName
            // customerPhone <- CustomerAddress.mobile
            // address        <- CustomerAddress
            // =======================================================

            const order = await tx.order.create({
                data: {
                    orderNumber: `EYM-${Date.now()}`,

                    customerId: customerRecord.id,

                    // ---------------------------------------------------
                    // DELIVERY SNAPSHOT
                    // ---------------------------------------------------

                    customerName: customerAddress.fullName,

                    customerEmail: email,

                    customerPhone: customerAddress.mobile,

                    addressLine1: customerAddress.addressLine1,

                    addressLine2: customerAddress.addressLine2,

                    city: customerAddress.city,

                    state: customerAddress.state,

                    postalCode: customerAddress.postalCode,

                    country: customerAddress.country,

                    // ---------------------------------------------------
                    // AMOUNTS
                    // ---------------------------------------------------

                    subtotal,

                    gstAmount: gst,

                    shippingAmount: shipping,

                    totalAmount,

                    // ---------------------------------------------------
                    // STATUS
                    // ---------------------------------------------------

                    status: 'PENDING',

                    paymentStatus: 'PENDING',

                    paymentOrderId: razorpayOrder.id,

                    // ---------------------------------------------------
                    // ORDER ITEMS
                    // ---------------------------------------------------

                    items: {
                        create: orderItems,
                    },
                },

                include: {
                    items: true,
                },
            })

            return {
                customer: customerRecord,
                customerAddress,
                order,
            }
        })

        // ---------------------------------------------------------
        // RESPONSE
        // ---------------------------------------------------------

        return NextResponse.json({
            id: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,

            orderId: result.order.id,

            customerId: result.customer.id,

            customerAddressId: result.customerAddress.id,
        })
    } catch (error) {
        console.error('Razorpay order creation failed:', error)

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