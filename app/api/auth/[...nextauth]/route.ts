import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import bcrypt from 'bcryptjs'

import { prisma } from '@/lib/prisma'

const handler = NextAuth({
    adapter: PrismaAdapter(prisma),

    session: {
        strategy: 'jwt',
    },

    providers: [
        CredentialsProvider({
            name: 'Credentials',

            credentials: {
                email: {
                    label: 'Email',
                    type: 'email',
                },
                password: {
                    label: 'Password',
                    type: 'password',
                },
            },

            async authorize(credentials) {
                console.log('AUTH: authorize called')

                if (!credentials?.email || !credentials?.password) {
                    console.log('AUTH: missing email or password')
                    return null
                }

                const email = credentials.email.trim().toLowerCase()

                console.log('AUTH: email:', email)

                const user = await prisma.user.findUnique({
                    where: { email },
                })

                console.log('AUTH: user found:', !!user)
                console.log('AUTH: password hash exists:', !!user?.passwordHash)

                if (!user) {
                    console.log('AUTH: USER NOT FOUND')
                    return null
                }

                if (!user.passwordHash) {
                    console.log('AUTH: PASSWORD HASH MISSING')
                    return null
                }

                const passwordValid = await bcrypt.compare(
                    credentials.password,
                    user.passwordHash,
                )

                console.log('AUTH: password valid:', passwordValid)

                if (!passwordValid) {
                    console.log('AUTH: PASSWORD INVALID')
                    return null
                }

                console.log('AUTH: LOGIN SUCCESS')

                return {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                }
            },
        }),

        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),

        FacebookProvider({
            clientId: process.env.FACEBOOK_CLIENT_ID!,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
        }),
    ],

    pages: {
        signIn: '/login',
    },

    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider !== 'credentials' && user.id) {
                const existingCustomer = await prisma.customer.findUnique({
                    where: {
                        userId: user.id,
                    },
                })

                if (!existingCustomer) {
                    await prisma.customer.create({
                        data: {
                            userId: user.id,
                            name: user.name || 'Earthymic Customer',
                            email: user.email,
                        },
                    })
                }
            }

            return true
        },
    },

    secret: process.env.NEXTAUTH_SECRET,
})

export { handler as GET, handler as POST }