import { randomBytes, scrypt } from 'node:crypto'
import { createCookieSessionStorage, redirect } from '@remix-run/node'

import { db } from './db.server'

interface LoginForm {
    username: string
    password: string
}

interface RegisterForm {
    username: string
    firstName: string
    lastName: string
    email: string
    password: string
}

interface ChangePasswordForm {
    username: string
    currentPassword: string
    newPassword: string
}

export interface UserSessionData {
    username: string
    firstName: string
    lastName: string
    email: string

    [key: string]: string
}

const { SESSION_SECRET, SESSION_COOKIE_NAME } = process.env
if (!SESSION_SECRET || !SESSION_COOKIE_NAME)
    throw new Error('SESSION_SECRET and SESSION_COOKIE_NAME must be set')

const storage = createCookieSessionStorage({
    cookie: {
        name: SESSION_COOKIE_NAME,
        secure: true,
        secrets: [SESSION_SECRET],
        sameSite: 'strict',
        path: '/',
        maxAge: 60 * 60 * 24 * 30, // 1 month
        httpOnly: true,
    },
})

export function getUserSession(request: Request) {
    return storage.getSession(request.headers.get('Cookie'))
}

export async function register({
    username,
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

    let user = await db.user.findUnique({
        where: {
            username,
            email,
        },
    })
    if (user) return null

    user = await db.user.create({
        data: {
            username,
            firstName,
            lastName,
            email,
            passwordHash,
        },
    })

    return user
}

export async function login({ username, password }: LoginForm) {
    const user = await db.user.findUnique({
        where: { username },
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

export async function updatePassword({
    username,
    currentPassword,
    newPassword,
}: ChangePasswordForm) {
    if (!(await login({ username, password: currentPassword }))) {
        return null
    }

    const passwordHash = await new Promise<string>((resolve, reject) => {
        const salt = randomBytes(16).toString('hex')
        scrypt(newPassword, salt, 32, (err, derivedKey) => {
            if (err) reject(err)
            else resolve(`${derivedKey.toString('hex')}:${salt}`)
        })
    })

    return await db.user.update({
        where: { username },
        data: {
            passwordHash,
        },
    })
}

export async function createUserSession(
    { username, firstName, lastName, email }: UserSessionData,
    redirectTo?: string
) {
    const session = await storage.getSession()
    session.set('username', username)
    session.set('email', email)
    session.set('firstName', firstName)
    session.set('lastName', lastName)

    if (redirectTo) {
        return redirect(redirectTo, {
            headers: {
                'Set-Cookie': await storage.commitSession(session),
            },
        })
    } else {
        return new Response(null, {
            headers: {
                'Set-Cookie': await storage.commitSession(session),
            },
        })
    }
}

export async function requireUser(
    request: Request,
    redirectTo: string = new URL(request.url).pathname
): Promise<UserSessionData> {
    const session = await getUserSession(request)
    const username = session.get('username')
    if (!username || typeof username !== 'string') {
        const searchParams = new URLSearchParams([['redirectTo', redirectTo]])
        throw redirect(`/login?${searchParams}`)
    }
    return {
        username,
        email: session.get('email'),
        firstName: session.get('firstName'),
        lastName: session.get('lastName'),
    }
}
