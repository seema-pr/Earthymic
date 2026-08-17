import crypto from 'crypto'
import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'

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

        // Step 1: Verify Razorpay signature
        const generatedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(
                `${razorpayOrderId}|${razorpayPaymentId}`,
            )
            .digest('hex')

        const isSignatureValid =
            generatedSignature === razorpaySignature

        if (!isSignatureValid) {
            return NextResponse.json(
                {
                    error: 'Invalid payment signature.',
                },
                {
                    status: 400,
                },
            )
        }

        // Step 2: Ask Razorpay for the actual payment
        const payment = await razorpay.payments.fetch(
            razorpayPaymentId,
        )

        // Step 3: Make sure the payment belongs to our Razorpay order
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

        // Step 4: Make sure the payment was actually captured
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

        return NextResponse.json({
            success: true,
            message: 'Payment verified successfully.',
            paymentId: payment.id,
            orderId: payment.order_id,
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