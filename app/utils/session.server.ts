import {randomBytes, scrypt} from 'node:crypto'
import {createCookieSessionStorage, redirect,} from "@remix-run/node";

import {db} from "./db.server";

type LoginForm = {
  email: string;
  password: string;
};

interface RegisterForm {
  firstName: string
  lastName: string
  email: string
  password: string
}

const {SESSION_SECRET, SESSION_COOKIE_NAME} = process.env;
if (!SESSION_SECRET || !SESSION_COOKIE_NAME) {
  throw new Error("SESSION_SECRET and SESSION_COOKIE_NAME must be set");
}

const storage = createCookieSessionStorage({
  cookie: {
    name: SESSION_COOKIE_NAME,
    secure: true,
    secrets: [SESSION_SECRET],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
  },
});

function getUserSession(request: Request) {
  return storage.getSession(request.headers.get("Cookie"));
}

export async function register({firstName, lastName, email, password}: RegisterForm) {
  const passwordHash = await new Promise<string>((resolve, reject) => {
    const salt = randomBytes(16).toString('hex')
    scrypt(password, salt, 32, (err, derivedKey) => {
      if (err)
        reject(err)
      else
        resolve(`${derivedKey.toString('hex')}:${salt}`)
    })
  })

  let user = await db.user.findFirst({
    where: {
      email,
    },
  })
  if (user) {
    return null
  }

  user = await db.user.create({
    data: {
      firstName,
      lastName,
      email,
      passwordHash,
    },
  })

  return {id: user.id};
}

export async function login({email, password,}: LoginForm) {
  const user = await db.user.findFirst({
    where: {email},
  });
  if (!user) {
    return null
  }

  const passwordValid = await new Promise<boolean>((resolve, reject) => {
    const [hash, salt] = user.passwordHash.split(':')
    scrypt(password, salt, 32, (err, derivedKey) => {
      if (err)
        reject(err)
      else
        resolve(hash === derivedKey.toString('hex'))
    })
  })
  if (!passwordValid) return null

  return {id: user.id};
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") {
    const searchParams = new URLSearchParams([
      ["redirectTo", redirectTo],
    ]);
    throw redirect(`/login?${searchParams}`);
  }
  return userId;
}

export async function createUserSession(
  userId: string,
  redirectTo: string
) {
  const session = await storage.getSession();
  session.set("userId", userId);
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}
