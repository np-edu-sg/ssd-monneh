import { Button, Center, PasswordInput, Text, TextInput } from '@mantine/core'
import type { ActionFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { Form, useActionData, useSubmit, useTransition } from '@remix-run/react'
import { useForm } from '@mantine/form'
import * as z from 'zod'

import { createUserSession, login } from '~/utils/session.server'

interface ActionData {
    errors?: Record<string, string>
}

const bodySchema = z.object({
    email: z.string().min(1, 'Email is required').email('Invalid email'),
    password: z.string().min(1, 'Password is required'),
})

export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData()

    const result = await bodySchema.safeParseAsync({
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

    const user = await login({
        email: result.data.email,
        password: result.data.password,
    })
    if (!user) {
        return json<ActionData>(
            {
                errors: {
                    password: 'Invalid email or password',
                },
            },
            { status: 403 }
        )
    }

    return createUserSession(user, '/dashboard')
}

export default function LoginPage() {
    const submit = useSubmit()
    const transition = useTransition()
    const data = useActionData<ActionData>()

    const form = useForm({
        initialValues: {
            email: '',
            password: '',
        },

        validate: {
            email: (value) =>
                /^\S+@\S+$/.test(value) ? null : 'Invalid email',
            password: (value) =>
                value.length > 0 ? null : 'Password is required',
        },
    })

    return (
        <Center component={'section'} style={{ height: '100%' }}>
            <Center
                inline
                p={'lg'}
                mb={'10%'}
                sx={(theme) => ({
                    width: '100%',
                    flexDirection: 'column',
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
                    Login to Monneh
                </Text>
                <Form
                    onSubmit={form.onSubmit(async (values) => {
                        submit(values, { method: 'post' })
                    })}
                >
                    <TextInput
                        size={'md'}
                        type={'email'}
                        placeholder={'Email Address'}
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
                        color={'violet'}
                        fullWidth
                        loading={transition.state === 'submitting'}
                    >
                        Login
                    </Button>
                </Form>
            </Center>
        </Center>
    )
}
