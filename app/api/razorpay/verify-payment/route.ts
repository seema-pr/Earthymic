import crypto from 'crypto'
import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'

import { prisma } from '@/lib/prisma'

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(request: Request) {
    try {
        const body = await request.json()

        const {
            razorpayPaymentId,
            razorpayOrderId,
            razorpaySignature,
        } = body

        if (
            !razorpayPaymentId ||
            !razorpayOrderId ||
            !razorpaySignature
        ) {
            return NextResponse.json(
                {
                    error: 'Payment verification details are required.',
                },
                {
                    status: 400,
                },
            )
        }

        const keySecret = process.env.RAZORPAY_KEY_SECRET

        if (!keySecret) {
            console.error('RAZORPAY_KEY_SECRET is not configured.')

            return NextResponse.json(
                {
                    error: 'Payment verification is not configured.',
                },
                {
                    status: 500,
                },
            )
        }

        /*
         * Step 1: Verify Razorpay signature.
         */
        const generatedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest('hex')

        if (generatedSignature !== razorpaySignature) {
            return NextResponse.json(
                {
                    error: 'Invalid payment signature.',
                },
                {
                    status: 400,
                },
            )
        }

        /*
         * Step 2: Fetch the actual Razorpay payment.
         */
        const payment = await razorpay.payments.fetch(
            razorpayPaymentId,
        )

        /*
         * Step 3: Verify the payment belongs to this
         * Razorpay order.
         */
        if (payment.order_id !== razorpayOrderId) {
            return NextResponse.json(
                {
                    error: 'Payment does not belong to this order.',
                },
                {
                    status: 400,
                },
            )
        }

        /*
         * Step 4: Verify payment is captured.
         */
        if (payment.status !== 'captured') {
            return NextResponse.json(
                {
                    error: `Payment is not captured. Current status: ${payment.status}`,
                },
                {
                    status: 400,
                },
            )
        }

        /*
         * Step 5: Find the Earthymic order created when
         * the Razorpay order was created.
         */
        const existingOrder = await prisma.order.findFirst({
            where: {
                paymentOrderId: razorpayOrderId,
            },
        })

        if (!existingOrder) {
            console.error(
                'Earthymic order not found for Razorpay order:',
                razorpayOrderId,
            )

            return NextResponse.json(
                {
                    error: 'Local order could not be found.',
                },
                {
                    status: 500,
                },
            )
        }

        /*
         * Step 6: Idempotency.
         *
         * If Razorpay calls this endpoint more than once,
         * don't create/modify the order incorrectly.
         */
        if (
            existingOrder.paymentStatus === 'PAID' &&
            existingOrder.paymentId === razorpayPaymentId
        ) {
            return NextResponse.json({
                success: true,
                message: 'Payment already verified.',
                paymentId: payment.id,
                orderId: existingOrder.id,
                orderNumber: existingOrder.orderNumber,
            })
        }

        /*
         * Step 7: Mark the local Earthymic order as paid.
         */
        const updatedOrder = await prisma.order.update({
            where: {
                id: existingOrder.id,
            },
            data: {
                status: 'PAID',
                paymentStatus: 'PAID',
                paymentId: payment.id,
                paymentOrderId: razorpayOrderId,
            },
        })

        return NextResponse.json({
            success: true,
            message: 'Payment verified successfully.',
            paymentId: payment.id,
            orderId: updatedOrder.id,
            orderNumber: updatedOrder.orderNumber,
        })
    } catch (error) {
        console.error(
            'Razorpay payment verification failed:',
            error,
        )

        return NextResponse.json(
            {
                error: 'Unable to verify payment.',
            },
            {
                status: 500,
            },
        )
    }
}