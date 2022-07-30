import { Button, Center, PasswordInput, Text, TextInput } from '@mantine/core'
import type { ActionFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { Form, useActionData, useSubmit, useTransition } from '@remix-run/react'
import { useForm } from '@mantine/form'
import * as z from 'zod'

import { createUserSession, login } from '~/utils/session.server'
import { getValidationErrorObject } from '~/utils/validation.server'

interface ActionData {
    errors?: Record<string, string>
}

const bodySchema = z
    .object({
        username: z.string().min(1, 'Username is required'),
        password: z.string().min(1, 'Password is required'),
    })
    .strict()

export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData()

    const result = await bodySchema.safeParseAsync({
        username: formData.get('username'),
        password: formData.get('password'),
    })

    if (!result.success) {
        return json<ActionData>(
            {
                errors: getValidationErrorObject(result.error.issues),
            },
            { status: 400 }
        )
    }

    const user = await login(result.data)
    if (!user) {
        return json<ActionData>(
            {
                errors: {
                    password: 'Invalid username or password',
                },
            },
            { status: 403 }
        )
    }

    if (user) return createUserSession(user, '/dashboard')
}

export default function LoginPage() {
    const submit = useSubmit()
    const transition = useTransition()
    const data = useActionData<ActionData>()

    const form = useForm({
        initialValues: {
            username: '',
            password: '',
        },

        validate: {
            username: (value) =>
                value.length > 0 ? null : 'Username is required',
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
                        placeholder={'Username'}
                        error={data?.errors?.email}
                        {...form.getInputProps('username')}
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
