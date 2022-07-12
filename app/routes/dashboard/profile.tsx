import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { PasswordInput, Text, TextInput } from '@mantine/core'
import type { User } from '@prisma/client'
import { requireUser } from '~/utils/session.server'
import { db } from '~/utils/db.server'

interface LoaderData {
  user: User
}

function exclude<T, Key extends keyof T>(
  item: T,
  ...keys: Key[]
): Omit<T, Key> {
  for (const key of keys)
    delete item[key]

  return item
}

export const loader: LoaderFunction = async ({ request }) => {
  const { id } = await requireUser(request)
  const user = await db.user.findUnique({
    where: { id },
  })
  return json({ user: exclude(user as User, 'passwordHash') })
}

export default function ProfilePage() {
  const data = useLoaderData<LoaderData>()
  return (
    <div>
      <Text weight={600} size={'xl'}>Hello, {data.user.firstName} {data.user.lastName}</Text>
      <br/>
      <TextInput disabled label={'First name'} value={data.user.firstName}/>
      <TextInput disabled label={'Last name'} value={data.user.lastName}/>
      <TextInput disabled label={'Email'} value={data.user.email}/>

      <br/>
      <br/>

      <Text weight={600} size={'md'}>Update password</Text>
      <br/>
      <PasswordInput disabled label={'Current password'}/>
      <PasswordInput disabled label={'New password'}/>
      <PasswordInput disabled label={'Confirm password'}/>
    </div>
  )
}
