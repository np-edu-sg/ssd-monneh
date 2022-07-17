import { Button, Center, PasswordInput, Text, TextInput } from '@mantine/core'
import type { ActionFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { Form, useActionData, useSubmit, useTransition } from '@remix-run/react'
import { useForm } from '@mantine/form'

import * as z from 'zod'
import { createUserSession, register } from '~/utils/session.server'
import { message, regex } from '~/utils/password-requirements'
import { getValidationErrorObject } from '~/utils/validation.server'

const bodySchema = z.object({
    username: z.string().min(1, 'Username is required'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().min(1, 'Email is required').email('Invalid email'),
    password: z
        .string()
        .min(1, 'New password is required')
        .regex(regex, message),
})

interface ActionData {
    errors?: Record<string, string>
}

export const action: ActionFunction = async ({ request }) => {
    const formData = await request.formData()
    const object: Record<string, string> = {}
    formData.forEach((value, key) => {
        if (typeof value === 'string') {
            object[key] = value
        }
    })

    const result = await bodySchema.safeParseAsync(object)
    if (!result.success) {
        return json<ActionData>(
            {
                errors: getValidationErrorObject(result.error.issues),
            },
            { status: 400 }
        )
    }

    const user = await register(result.data)
    if (!user) {
        return json<ActionData>(
            {
                errors: {
                    username: 'User already exists with this username',
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
            username: '',
            firstName: '',
            lastName: '',
            email: '',
            password: '',
        },

        validate: {
            username: (value) =>
                value.length > 0 ? null : 'Username is required',
            firstName: (value) =>
                value.length > 0 ? null : 'First name is required',
            lastName: (value) =>
                value.length > 0 ? null : 'Last name is required',
            email: (value) =>
                /^\S+@\S+$/.test(value) ? null : 'Invalid email',
            password: (value) => (regex.test(value) ? null : message),
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
                        placeholder={'Username'}
                        error={data?.errors?.username}
                        {...form.getInputProps('username')}
                    />

                    <br />

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
                        type={'email'}
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
