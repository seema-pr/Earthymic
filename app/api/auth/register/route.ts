import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
    try {
        const body = await request.json()

        const name = String(body.name ?? '').trim()
        const email = String(body.email ?? '').trim().toLowerCase()
        const phone = String(body.phone ?? '').trim()
        const password = String(body.password ?? '')

        if (!name) {
            return NextResponse.json(
                { error: 'Name is required.' },
                { status: 400 },
            )
        }

        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            return NextResponse.json(
                { error: 'Enter a valid email address.' },
                { status: 400 },
            )
        }

        if (!/^[6-9]\d{9}$/.test(phone)) {
            return NextResponse.json(
                { error: 'Enter a valid 10-digit mobile number.' },
                { status: 400 },
            )
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters.' },
                { status: 400 },
            )
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'An account with this email already exists.' },
                { status: 409 },
            )
        }

        const passwordHash = await bcrypt.hash(password, 12)

        const user = await prisma.user.create({
            data: {
                name,
                email,
                passwordHash,
                customer: {
                    create: {
                        name,
                        email,
                        phone,
                    },
                },
            },
            include: {
                customer: true,
            },
        })

        return NextResponse.json(
            {
                message: 'Account created successfully.',
                userId: user.id,
                customerId: user.customer?.id,
            },
            { status: 201 },
        )
    } catch (error) {
        console.error('Registration failed:', error)

        return NextResponse.json(
            { error: 'Unable to create account. Please try again.' },
            { status: 500 },
        )
    }
}