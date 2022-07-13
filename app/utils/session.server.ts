import { randomBytes, scrypt } from 'node:crypto'
import { createCookieSessionStorage, redirect } from '@remix-run/node'

import { db } from './db.server'

interface LoginForm {
    email: string
    password: string
}

interface RegisterForm {
    firstName: string
    lastName: string
    email: string
    password: string
}

export interface UserSessionData {
    id: number
    firstName: string
    lastName: string
    email: string
}

const { SESSION_SECRET, SESSION_COOKIE_NAME } = process.env
if (!SESSION_SECRET || !SESSION_COOKIE_NAME)
    throw new Error('SESSION_SECRET and SESSION_COOKIE_NAME must be set')

const storage = createCookieSessionStorage({
    cookie: {
        name: SESSION_COOKIE_NAME,
        secure: true,
        secrets: [SESSION_SECRET],
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        httpOnly: true,
    },
})

export function getUserSession(request: Request) {
    return storage.getSession(request.headers.get('Cookie'))
}

export async function register({
    firstName,
    lastName,
    email,
    password,
}: RegisterForm) {
    const passwordHash = await new Promise<string>((resolve, reject) => {
        const salt = randomBytes(16).toString('hex')
        scrypt(password, salt, 32, (err, derivedKey) => {
            if (err) reject(err)
            else resolve(`${derivedKey.toString('hex')}:${salt}`)
        })
    })

    let user = await db.user.findFirst({
        where: {
            email,
        },
    })
    if (user) return null

    user = await db.user.create({
        data: {
            firstName,
            lastName,
            email,
            passwordHash,
        },
    })

    return user
}

export async function login({ email, password }: LoginForm) {
    const user = await db.user.findFirst({
        where: { email },
    })
    if (!user) return null

    const passwordValid = await new Promise<boolean>((resolve, reject) => {
        const [hash, salt] = user.passwordHash.split(':')
        scrypt(password, salt, 32, (err, derivedKey) => {
            if (err) reject(err)
            else resolve(hash === derivedKey.toString('hex'))
        })
    })
    if (!passwordValid) return null

    return user
}

export async function createUserSession(
    { id, firstName, lastName, email }: UserSessionData,
    redirectTo: string
) {
    const session = await storage.getSession()
    session.set('id', id)
    session.set('email', email)
    session.set('firstName', firstName)
    session.set('lastName', lastName)
    return redirect(redirectTo, {
        headers: {
            'Set-Cookie': await storage.commitSession(session),
        },
    })
}

export async function requireUser(
    request: Request,
    redirectTo: string = new URL(request.url).pathname
): Promise<UserSessionData> {
    const session = await getUserSession(request)
    const id = session.get('id')
    if (!id || typeof id !== 'number') {
        const searchParams = new URLSearchParams([['redirectTo', redirectTo]])
        throw redirect(`/login?${searchParams}`)
    }
    return {
        id,
        email: session.get('email'),
        firstName: session.get('firstName'),
        lastName: session.get('lastName'),
    }
}
