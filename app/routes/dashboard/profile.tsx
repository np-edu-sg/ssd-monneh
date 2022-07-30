import type { ActionFunction, LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import type { ThrownResponse } from '@remix-run/react'
import {
    Form,
    useActionData,
    useLoaderData,
    useSubmit,
    useTransition,
} from '@remix-run/react'
import {
    Box,
    Button,
    Group,
    PasswordInput,
    SimpleGrid,
    Stack,
    Text,
    TextInput,
    Transition,
} from '@mantine/core'
import { useForm } from '@mantine/form'
import { useMemo } from 'react'
import type { UserSessionData } from '~/utils/session.server'
import {
    createUserSession,
    requireUser,
    updatePassword,
} from '~/utils/session.server'
import { db } from '~/utils/db.server'
import * as z from 'zod'
import { message, regex } from '~/utils/password-requirements'
import { getValidationErrorObject } from '~/utils/validation.server'

interface LoaderData {
    user: UserSessionData & Record<string, string>
}

interface ActionData {
    errors?: Record<string, string>
}

type BadRequestError = ThrownResponse<400, string>
type UnauthorizedError = ThrownResponse<403, string>
type ThrownResponses = BadRequestError | UnauthorizedError

export const loader: LoaderFunction = async ({ request }) => {
    const { username } = await requireUser(request)
    const user = await db.user.findUnique({
        select: {
            email: true,
            firstName: true,
            lastName: true,
            username: true,
            passwordHash: false,
        },
        where: { username },
    })
    if (!user) throw json('User does not exist', { status: 400 })
    return json<LoaderData>({ user })
}

const updateBodySchema = z.object({
    username: z.string().min(1, 'Username is required'),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().min(1, 'Email is required').email('Invalid email'),
})

const updatePasswordBodySchema = z
    .object({
        currentPassword: z.string().min(1, 'Current password is required'),
        newPassword: z
            .string()
            .min(1, 'New password is required')
            .regex(regex, message),
        confirmPassword: z.string().min(1, 'Confirm password is required'),
    })
    .refine(
        ({ newPassword, confirmPassword }) => newPassword === confirmPassword,
        'Confirm password does not match new password'
    )

export const action: ActionFunction = async ({ request }) => {
    const { username } = await requireUser(request)
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
                return json<ActionData>(
                    {
                        errors: getValidationErrorObject(result.error.issues),
                    },
                    { status: 400 }
                )
            }
            const {
                firstName,
                lastName,
                email,
                username: newUsername,
            } = result.data
            if (
                newUsername !== username &&
                (await db.user.findUnique({ where: { username: newUsername } }))
            ) {
                return json<ActionData>({
                    errors: {
                        username: 'Username is already in use',
                    },
                })
            }

            const user = await db.user.update({
                where: { username },
                data: { firstName, lastName, email, username: newUsername },
            })

            return createUserSession(user)
        }
        case 'update-password': {
            const object: Record<string, string> = {}
            formData.forEach((value, key) => {
                if (typeof value === 'string') {
                    object[key] = value
                }
            })
            const result = await updatePasswordBodySchema.safeParseAsync(object)
            if (!result.success) {
                return json<ActionData>(
                    {
                        errors: getValidationErrorObject(result.error.issues),
                    },
                    { status: 400 }
                )
            }

            const user = await updatePassword({ ...result.data, username })
            if (!user) {
                return json<ActionData>({
                    errors: {
                        currentPassword: 'Password is incorrect',
                    },
                })
            }

            return createUserSession(user)
        }
        default:
            return json({})
    }
}

export default function ProfilePage() {
    const data = useLoaderData<LoaderData>()
    const actionData = useActionData<ActionData>()
    const transition = useTransition()
    const submit = useSubmit()

    const form = useForm({
        initialValues: data.user,
        validate: {
            username: (value) =>
                value.length > 0 ? null : 'Username is required',
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
            newPassword: (value) => (regex.test(value) ? null : message),
            confirmPassword: (value, { newPassword }) =>
                value === newPassword
                    ? null
                    : 'Confirm password does not match new password',
        },
    })

    const formDirty = useMemo(() => {
        return Object.keys(form.values).some(
            (key) => form.values[key] !== data.user[key]
        )
    }, [data.user, form.values])

    const passwordFormDirty = useMemo(() => {
        return Object.values(passwordForm.values).some((value) => value)
    }, [passwordForm.values])

    return (
        <Stack style={{ height: '100%' }}>
            <Text weight={600} size={'xl'} component={'h1'}>
                Hello, {data.user.firstName} {data.user.lastName}
            </Text>

            <SimpleGrid
                cols={1}
                spacing={'lg'}
                style={{ flex: 1 }}
                breakpoints={[
                    {
                        minWidth: 'md',
                        cols: 2,
                    },
                ]}
            >
                <div>
                    <Text weight={600} size={'lg'} component={'h2'}>
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
                                label={'Username'}
                                error={actionData?.errors?.username}
                                {...form.getInputProps('username')}
                            />
                            <TextInput
                                label={'First name'}
                                error={actionData?.errors?.firstName}
                                {...form.getInputProps('firstName')}
                            />
                            <TextInput
                                label={'Last name'}
                                error={actionData?.errors?.lastName}
                                {...form.getInputProps('lastName')}
                            />
                            <TextInput
                                label={'Email'}
                                error={actionData?.errors?.email}
                                {...form.getInputProps('email')}
                            />
                            <Transition
                                mounted={formDirty}
                                transition={'scale-y'}
                                duration={200}
                            >
                                {(styles) => (
                                    <div
                                        style={{
                                            ...styles,
                                            marginLeft: 'auto',
                                        }}
                                    >
                                        <br />
                                        <Button
                                            variant={'outline'}
                                            type={'submit'}
                                            loading={
                                                transition.state ===
                                                'submitting'
                                            }
                                        >
                                            Update
                                        </Button>
                                    </div>
                                )}
                            </Transition>
                        </Stack>
                    </Form>
                </div>

                <div>
                    <Box
                        p={'lg'}
                        sx={(theme) => ({
                            borderRadius: theme.radius.sm,
                            borderWidth: 2,
                            borderStyle: 'solid',
                            borderColor:
                                theme.colorScheme === 'dark'
                                    ? theme.colors.red[7]
                                    : theme.colors.red[4],
                        })}
                    >
                        <Text weight={600} size={'lg'} color={'red'}>
                            Danger zone
                        </Text>
                        <br />
                        <Text weight={600} size={'lg'}>
                            Update password
                        </Text>
                        <br />
                        <Form
                            onSubmit={passwordForm.onSubmit(async (values) => {
                                await submit(
                                    { ...values, action: 'update-password' },
                                    { method: 'post' }
                                )
                            })}
                        >
                            <Stack spacing={'sm'}>
                                <PasswordInput
                                    label={'Current password'}
                                    error={actionData?.errors?.currentPassword}
                                    {...passwordForm.getInputProps(
                                        'currentPassword'
                                    )}
                                />
                                <PasswordInput
                                    label={'New password'}
                                    error={actionData?.errors?.newPassword}
                                    {...passwordForm.getInputProps(
                                        'newPassword'
                                    )}
                                />
                                <PasswordInput
                                    label={'Confirm password'}
                                    error={actionData?.errors?.confirmPassword}
                                    {...passwordForm.getInputProps(
                                        'confirmPassword'
                                    )}
                                />
                                <Transition
                                    mounted={passwordFormDirty}
                                    transition={'scale-y'}
                                    duration={200}
                                >
                                    {(styles) => (
                                        <div
                                            style={{
                                                ...styles,
                                                marginLeft: 'auto',
                                            }}
                                        >
                                            <br />
                                            <Button
                                                color={'red'}
                                                variant={'outline'}
                                                type={'submit'}
                                                loading={
                                                    transition.state ===
                                                    'submitting'
                                                }
                                            >
                                                Update
                                            </Button>
                                        </div>
                                    )}
                                </Transition>
                            </Stack>
                        </Form>
                    </Box>
                </div>
            </SimpleGrid>

            <Group position={'right'}>
                <form action={'/logout'} method={'post'}>
                    <Button type={'submit'} variant={'subtle'}>
                        Logout
                    </Button>
                </form>
            </Group>
        </Stack>
    )
}
