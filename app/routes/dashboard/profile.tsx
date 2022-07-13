import type { ActionFunction, LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import type { ThrownResponse } from '@remix-run/react'
import { Form, useLoaderData, useSubmit, useTransition } from '@remix-run/react'
import {
    Button,
    Card,
    PasswordInput,
    Stack,
    Text,
    TextInput,
    Transition,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useMemo } from 'react'
import { createUserSession, requireUser } from '~/utils/session.server'
import type { User } from '@prisma/client'
import { db } from '~/utils/db.server'
import * as z from 'zod'

interface LoaderData {
    user: {
        email: string
        firstName: string
        lastName: string
    }
}

type BadRequestError = ThrownResponse<400, string>
type ThrownResponses = BadRequestError

function exclude<T, Key extends keyof T>(
    item: T,
    ...keys: Key[]
): Omit<T, Key> {
    for (const key of keys) delete item[key]

    return item
}

export const loader: LoaderFunction = async ({ request }) => {
    const { id } = await requireUser(request)
    const user = await db.user.findUnique({
        where: { id },
    })
    return json<LoaderData>({ user: exclude(user as User, 'passwordHash') })
}

const updateBodySchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().min(1, 'Email is required').email('Invalid email'),
})

export const action: ActionFunction = async ({ request }) => {
    const { id } = await requireUser(request)
    const formData = await request.formData()
    const action = formData.get('action')

    switch (action) {
        case 'update': {
            const object: Record<string, string> = {}
            formData.forEach((value, key) => {
                if (typeof value === 'string') {
                    object[key] = value
                }
            })
            const result = await updateBodySchema.safeParseAsync(object)
            if (!result.success) {
                throw json('Bad request', { status: 400 })
            }
            const { firstName, lastName, email } = result.data
            const user = await db.user.update({
                where: { id },
                data: { firstName, lastName, email },
            })

            return createUserSession(user, '/dashboard/profile')
        }
        case 'updatePassword': {
            // const object: Record<string, string> = {}
            // formData.forEach((value, key) => {
            //     if (typeof value === 'string') {
            //         object[key] = value
            //     }
            // })
            // const result = await updateBodySchema.safeParseAsync(object)
            // if (!result.success) {
            //     throw json('Bad request', { status: 400 })
            // }
            // await db.user.update({
            //     where: { id },
            //     data: object,
            // })
            return new Response(null, { status: 204 })
        }
        default:
            return json({})
    }
}

export default function ProfilePage() {
    const data = useLoaderData<LoaderData>()
    const transition = useTransition()
    const submit = useSubmit()

    const form = useForm({
        initialValues: data.user,
        validate: {
            firstName: (value) =>
                value.length > 0 ? null : 'First name is required',
            lastName: (value) =>
                value.length > 0 ? null : 'Last name is required',
            email: (value) =>
                /^\S+@\S+$/.test(value) ? null : 'Invalid email',
        },
    })

    const passwordForm = useForm({
        initialValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },

        validate: {
            currentPassword: (value) =>
                value.length > 0 ? null : 'Current password is required',
            newPassword: (value) =>
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/g.test(
                    value
                )
                    ? null
                    : 'New password must have a minimum of eight characters, at least one uppercase letter, one lowercase letter, one number and one special character',
            confirmPassword: (value, { newPassword }) =>
                value === newPassword ? null : 'Passwords are not the same',
        },
    })

    const formDirty = useMemo(() => {
        return Object.keys(form.values).some(
            (key) =>
                (form.values as Record<string, string | number>)[key] !==
                (data.user as Record<string, string | number>)[key]
        )
    }, [data.user, form.values])

    const passwordFormDirty = useMemo(() => {
        return Object.values(passwordForm.values).some((value) => value)
    }, [passwordForm.values])

    return (
        <section>
            <Text weight={600} size={'xl'} component={'h1'}>
                Hello, {data.user.firstName} {data.user.lastName}
            </Text>
            <Card radius={'md'}>
                <Text
                    weight={600}
                    size={'lg'}
                    component={'h2'}
                    style={{ opacity: 0.75, marginTop: 0 }}
                >
                    Your profile
                </Text>
                <Form
                    onSubmit={form.onSubmit(async (values) => {
                        await submit(
                            { ...values, action: 'update' },
                            { method: 'post' }
                        )
                    })}
                >
                    <Stack spacing={'sm'}>
                        <TextInput
                            label={'First name'}
                            {...form.getInputProps('firstName')}
                        />
                        <TextInput
                            label={'Last name'}
                            {...form.getInputProps('lastName')}
                        />
                        <TextInput
                            label={'Email'}
                            {...form.getInputProps('email')}
                        />
                        <Transition
                            mounted={formDirty}
                            transition={'scale-y'}
                            duration={200}
                        >
                            {(styles) => (
                                <div style={styles}>
                                    <Button
                                        variant={'outline'}
                                        type={'submit'}
                                        loading={
                                            transition.state === 'submitting'
                                        }
                                    >
                                        Update
                                    </Button>
                                </div>
                            )}
                        </Transition>
                    </Stack>
                </Form>
            </Card>

            <br />

            <Card>
                <Text
                    weight={600}
                    size={'lg'}
                    component={'h2'}
                    style={{ opacity: 0.75, marginTop: 0 }}
                >
                    Update password
                </Text>
                <Form>
                    <Stack spacing={'sm'}>
                        <PasswordInput
                            label={'Current password'}
                            {...passwordForm.getInputProps('currentPassword')}
                        />
                        <PasswordInput
                            label={'New password'}
                            {...passwordForm.getInputProps('newPassword')}
                        />
                        <PasswordInput
                            label={'Confirm password'}
                            {...passwordForm.getInputProps('confirmPassword')}
                        />
                        <Transition
                            mounted={passwordFormDirty}
                            transition={'scale-y'}
                            duration={200}
                        >
                            {(styles) => (
                                <div style={styles}>
                                    <Button variant={'outline'} type={'submit'}>
                                        Update
                                    </Button>
                                </div>
                            )}
                        </Transition>
                    </Stack>
                </Form>
            </Card>
        </section>
    )
}
