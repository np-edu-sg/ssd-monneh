import { Button, Center, PasswordInput, Text, TextInput } from '@mantine/core'
import type { ActionFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { Form, useActionData, useSubmit, useTransition } from '@remix-run/react'
import { useForm } from '@mantine/form'

import * as z from 'zod'
import { createUserSession, register } from '~/utils/session.server'

const bodySchema = z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().min(1, 'Email is required').email('Invalid email'),
    password: z.string().min(1, 'Password is required o_0'),
})

interface ActionData {
    errors?: Record<string, string>
}

export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData()
    const result = await bodySchema.safeParseAsync({
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        password: formData.get('password'),
    })
    if (!result.success) {
        return json<ActionData>(
            {
                errors: result.error.issues.reduce<Record<string, string>>(
                    (a, v) => {
                        a[v.path.toString()] = v.message
                        return a
                    },
                    {}
                ),
            },
            { status: 400 }
        )
    }

    const user = await register(result.data)
    if (!user) {
        return json<ActionData>(
            {
                errors: {
                    email: 'User already exists with this email',
                },
            },
            { status: 409 }
        )
    }

    return createUserSession(user, '/dashboard')
}

export default function RegisterPage() {
    const submit = useSubmit()
    const transition = useTransition()
    const data = useActionData<ActionData>()

    const form = useForm({
        initialValues: {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
        },

        validate: {
            firstName: (value) =>
                value.length > 0 ? null : 'First name is required',
            lastName: (value) =>
                value.length > 0 ? null : 'Last name is required',
            email: (value) =>
                /^\S+@\S+$/.test(value) ? null : 'Invalid email',
            password: (value) =>
                value.length > 0 ? null : 'Password is required',
        },
    })

    return (
        <Center component={'section'} style={{ height: '100%' }}>
            <Center
                sx={(theme) => ({
                    padding: theme.spacing.lg,
                    flexDirection: 'column',
                    marginBottom: '10%',
                    width: '100%',
                    [theme.fn.largerThan('xs')]: {
                        width: '45%',
                    },
                    [theme.fn.largerThan('md')]: {
                        width: '35%',
                    },
                    [theme.fn.largerThan('lg')]: {
                        width: '30%',
                    },
                })}
            >
                <Text component={'h1'} size={'xl'} style={{ marginTop: 0 }}>
                    Register
                </Text>
                <Form
                    onSubmit={form.onSubmit((values) => {
                        submit(values, { method: 'post' })
                    })}
                >
                    <TextInput
                        size={'md'}
                        placeholder={'First name'}
                        error={data?.errors?.firstName}
                        {...form.getInputProps('firstName')}
                    />

                    <br />

                    <TextInput
                        size={'md'}
                        placeholder={'Last name'}
                        error={data?.errors?.lastName}
                        {...form.getInputProps('lastName')}
                    />

                    <br />

                    <TextInput
                        size={'md'}
                        placeholder={'Email'}
                        error={data?.errors?.email}
                        {...form.getInputProps('email')}
                    />

                    <br />

                    <PasswordInput
                        size={'md'}
                        placeholder={'Password'}
                        error={data?.errors?.password}
                        {...form.getInputProps('password')}
                    />

                    <br />

                    <Button
                        type={'submit'}
                        fullWidth
                        loading={transition.state === 'submitting'}
                    >
                        Register
                    </Button>
                </Form>
            </Center>
        </Center>
    )
}
