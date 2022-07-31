import {
    Box,
    Button,
    Center,
    Group,
    PasswordInput,
    Progress,
    Text,
    TextInput,
} from '@mantine/core'
import type { ActionFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { Form, useActionData, useSubmit, useTransition } from '@remix-run/react'
import { useForm } from '@mantine/form'

import * as z from 'zod'
import { createUserSession, register } from '~/utils/session.server'
import { message, regex } from '~/utils/password-requirements'
import { getValidationErrorObject } from '~/utils/validation.server'
import { IconCheck, IconX } from '@tabler/icons'

const requirements = [
    { re: /[0-9]/, label: 'Includes number' },
    { re: /[a-z]/, label: 'Includes lowercase letter' },
    { re: /[A-Z]/, label: 'Includes uppercase letter' },
    { re: /[$&+,:;=?@#|'<>.^*()%!-]/, label: 'Includes special symbol' },
]

const bodySchema = z.object({
    username: z
        .string()
        .min(1, 'Username is required')
        .max(64, 'Usernames should not be longer than 64 characters'),
    firstName: z
        .string()
        .min(1, 'First name is required')
        .max(64, 'First Name should not be longer than 64 characters'),
    lastName: z
        .string()
        .min(1, 'Last name is required')
        .max(64, 'Last Name should not be longer than 64 characters'),
    email: z.string().min(1, 'Email is required').email('Invalid email'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[0-9]/, 'Password must include a number')
        .regex(/[a-z]/, 'Password must include a number')
        .regex(/[A-Z]/, 'Password must include a number')
        .regex(
            /[$&+,:;=?@#|'<>.^*()%!-]/,
            'Password must include a special symbol'
        ),
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
                    username: 'User already exists with this username or email',
                    email: 'User already exists with this username or email',
                },
            },
            { status: 409 }
        )
    }

    return createUserSession(user, '/dashboard')
}

function getStrength(password: string) {
    let multiplier = password.length > 5 ? 0 : 1

    requirements.forEach((requirement) => {
        if (!requirement.re.test(password)) {
            multiplier += 1
        }
    })

    return Math.max(100 - (100 / (requirements.length + 1)) * multiplier, 0)
}

function PasswordRequirement({
    meets,
    label,
}: {
    meets: boolean
    label: string
}) {
    return (
        <Text color={meets ? 'teal' : 'red'} mt={5} size={'sm'}>
            <Center inline>
                {meets ? (
                    <IconCheck size={14} stroke={1.5} />
                ) : (
                    <IconX size={14} stroke={1.5} />
                )}
                <Box ml={7}>{label}</Box>
            </Center>
        </Text>
    )
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
            password: (value) => {
                return requirements
                    .map((r) => r.re.test(value))
                    .reduce<string | null>((a, v) => {
                        if (!v) {
                            a = 'Invalid password'
                        }
                        return a
                    }, null)
            },
        },
    })

    const strength = getStrength(form.values.password)
    const checks = requirements.map((requirement, index) => (
        <PasswordRequirement
            key={index}
            label={requirement.label}
            meets={requirement.re.test(form.values.password)}
        />
    ))
    const bars = Array(4)
        .fill(0)
        .map((_, index) => (
            <Progress
                styles={{ bar: { transitionDuration: '0ms' } }}
                value={
                    form.values.password.length > 0 && index === 0
                        ? 100
                        : strength >= ((index + 1) / 4) * 100
                        ? 100
                        : 0
                }
                color={
                    strength > 80 ? 'teal' : strength > 50 ? 'yellow' : 'red'
                }
                key={index}
                size={4}
            />
        ))

    return (
        <Center component={'section'} style={{ height: '100%' }}>
            <Center
                sx={(theme) => ({
                    padding: theme.spacing.lg,
                    flexDirection: 'column',
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

                    <Group spacing={5} grow mt={'xs'} mb={'md'}>
                        {bars}
                    </Group>

                    <PasswordRequirement
                        label={'Has at least 6 characters'}
                        meets={form.values.password.length > 5}
                    />

                    {checks}

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
