import type { LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { Form, useLoaderData } from '@remix-run/react'
import {
    Button,
    Card,
    PasswordInput,
    Stack,
    Text,
    TextInput,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import type { User } from '@prisma/client'
import { useEffect, useMemo } from 'react'
import { requireUser } from '~/utils/session.server'
import { db } from '~/utils/db.server'

interface LoaderData {
    user: User
}

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
    return json({ user: exclude(user as User, 'passwordHash') })
}

export default function ProfilePage() {
    const data = useLoaderData<LoaderData>()
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

    const formDirty = useMemo(
        () =>
            Object.keys(form.values).some(
                (key) =>
                    (form.values as Record<string, string | number>)[key] !==
                    (data.user as Record<string, string | number>)[key]
            ),
        [data.user, form.values]
    )

    useEffect(() => {
        console.log(form.values)
    }, [form.values])

    return (
        <section>
            <Text weight={600} size="xl" component="h1">
                Hello,
                {data.user.firstName} {data.user.lastName}
            </Text>
            <Card radius="md">
                <Text
                    weight={600}
                    size="lg"
                    component="h2"
                    style={{ opacity: 0.75, marginTop: 0 }}
                >
                    Your profile
                </Text>
                <Form>
                    <Stack spacing="sm">
                        <TextInput
                            label="First name"
                            {...form.getInputProps('firstName')}
                        />
                        <TextInput
                            label="Last name"
                            {...form.getInputProps('lastName')}
                        />
                        <TextInput
                            label="Email"
                            {...form.getInputProps('email')}
                        />
                        {formDirty && (
                            <div>
                                <Button variant="outline" type="submit">
                                    Update
                                </Button>
                            </div>
                        )}
                    </Stack>
                </Form>
            </Card>

            <br />

            <Card>
                <Text
                    weight={600}
                    size="lg"
                    component="h2"
                    style={{ opacity: 0.75, marginTop: 0 }}
                >
                    Update password
                </Text>
                <Form>
                    <Stack spacing="sm">
                        <PasswordInput
                            label="Current password"
                            {...passwordForm.getInputProps('currentPassword')}
                        />
                        <PasswordInput
                            label="New password"
                            {...passwordForm.getInputProps('newPassword')}
                        />
                        <PasswordInput
                            label="Confirm password"
                            {...passwordForm.getInputProps('confirmPassword')}
                        />
                        <div>
                            <Button variant="outline" type="submit">
                                Update
                            </Button>
                        </div>
                    </Stack>
                </Form>
            </Card>
        </section>
    )
}
