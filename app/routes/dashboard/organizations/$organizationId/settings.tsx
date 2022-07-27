import type { ActionFunction, LoaderFunction } from '@remix-run/node'
import { requireUser } from '~/utils/session.server'
import invariant from 'tiny-invariant'
import { requireAuthorization } from '~/utils/authorization.server'
import { db } from '~/utils/db.server'
import { json, redirect } from '@remix-run/node'
import type { ThrownResponse } from '@remix-run/react'
import {
    Form,
    useCatch,
    useLoaderData,
    useParams,
    useSubmit,
} from '@remix-run/react'
import { Anchor, Breadcrumbs, Center, Text, TextInput } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDebounceFn } from 'ahooks'
import type { AutoCompleteFilter } from '~/components'
import { useCallback } from 'react'
import { getValidationErrorObject } from '~/utils/validation.server'
import { Prisma } from '@prisma/client'
import * as z from 'zod'
import { Role } from '~/utils/roles'

// TODO: User search is duplicated across many places, should probably extract it
enum Action {
    UserSearch = 'user-search',
    AddMembers = 'add-members',
    DeleteMember = 'delete-member',
}

interface UserSearchActionData {
    readonly action: Action.UserSearch
    users: { label: string; value: string }[]
}

interface AddMembersActionData {
    readonly action: Action.AddMembers
    errors?: Record<string, string>
}

type ActionData = UserSearchActionData | AddMembersActionData

const createAddMembersBodySchema = (requesterUsername: string) =>
    z.object({
        members: z.array(
            z.object({
                username: z
                    .string()
                    .min(1, 'Username is required')
                    .refine(
                        (value) => value !== requesterUsername,
                        'Username cannot be your own'
                    ),
                role: z.nativeEnum(Role),
            })
        ),
    })

export const action: ActionFunction = async ({ request, params }) => {
    if (!params.organizationId)
        throw json('Organization ID is required', { status: 400 })

    const organizationId = parseInt(params.organizationId)
    const { username } = await requireUser(request)
    const formData = await request.formData()

    const action = formData.get('action')

    switch (action) {
        case Action.UserSearch: {
            const search = formData.get('search')
            if (!search || typeof search !== 'string') {
                return json<ActionData>({
                    action: Action.UserSearch,
                    users: [],
                })
            }

            const data = await db.user.findMany({
                select: { username: true, firstName: true, lastName: true },
                where: {
                    OR: {
                        username: { search },
                        firstName: { search },
                        lastName: { search },
                        email: { search },
                    },
                    NOT: {
                        username,
                    },
                },
            })

            return json<ActionData>({
                action: Action.UserSearch,
                users: data.map(({ firstName, lastName, username }) => ({
                    label: `${firstName} ${lastName}`,
                    value: username,
                })),
            })
        }

        case Action.AddMembers: {
            const object: Record<string, string> = {}
            formData.forEach((value, key) => {
                if (typeof value === 'string') {
                    object[key] = value
                }
            })
            if (object['members']) {
                try {
                    object['members'] = JSON.parse(object['members'])
                } catch {
                    return json<ActionData>({
                        action: Action.AddMembers,
                        errors: {
                            members: 'Members must be a marshalled object',
                        },
                    })
                }
            }
            const result = await createAddMembersBodySchema(
                username
            ).safeParseAsync(object)
            if (!result.success) {
                // TODO - although there is a validation error response, it is not handled on the client because of the list nature
                return json<ActionData>({
                    action: Action.AddMembers,
                    errors: getValidationErrorObject(result.error.issues),
                })
            }

            await requireAuthorization(
                username,
                organizationId,
                (role) => role.allowUpdateOrganization
            )

            await db.$transaction(async (prisma) => {
                await Promise.all(
                    result.data.members.map(async ({ username, role }) => {
                        try {
                            await prisma.organizationToUser.upsert({
                                where: {
                                    organizationId_username: {
                                        organizationId,
                                        username,
                                    },
                                },
                                update: {
                                    role,
                                    organization: {
                                        connect: {
                                            id: organizationId,
                                        },
                                    },
                                    user: {
                                        connect: {
                                            username,
                                        },
                                    },
                                },
                                create: {
                                    role,
                                    organization: {
                                        connect: {
                                            id: organizationId,
                                        },
                                    },
                                    user: {
                                        connect: {
                                            username,
                                        },
                                    },
                                },
                            })
                        } catch (e) {
                            if (
                                e instanceof
                                Prisma.PrismaClientKnownRequestError
                            ) {
                                // P2025 refers to user not found, which we silently fail
                                if (e.code !== 'P2025') {
                                    throw e
                                }
                            }
                        }
                    })
                )

                await prisma.organization.update({
                    where: {
                        id: organizationId,
                    },
                    data: {
                        completedSetup: true,
                    },
                })
            })

            return redirect(`/dashboard/organizations/${organizationId}`)
        }
    }
}

interface LoaderData {
    organization: {
        name: string
        users: string[]
    }
}

type OrganizationNotFoundError = ThrownResponse<404, string>
type ThrownResponses = OrganizationNotFoundError

export const loader: LoaderFunction = async ({ request, params }) => {
    invariant(params.organizationId, 'Expected params.organizationId')
    const { username } = await requireUser(request)

    const organizationId = parseInt(params.organizationId)
    await requireAuthorization(
        username,
        organizationId,
        (role) => role.allowUpdateOrganization
    )

    const organization = await db.organization.findUnique({
        where: { id: organizationId },
        select: {
            name: true,
            users: {
                select: {
                    user: {
                        select: {
                            username: true,
                        },
                    },
                },
            },
        },
    })

    if (!organization) {
        throw json('Organization not found', { status: 404 })
    }

    const users = organization.users.map(({ user: { username } }) => username)

    return json<LoaderData>({
        organization: {
            ...organization,
            users,
        },
    })
}

export default function OrganizationSettingsPage() {
    const submit = useSubmit()
    const { organizationId } = useParams()
    const data = useLoaderData<LoaderData>()

    const form = useForm({
        initialValues: {
            name: data.organization.name,
            members: data.organization.users,
        },
    })

    const { run: runSearch } = useDebounceFn(
        (search: string) => {
            submit({ search, action: Action.UserSearch }, { method: 'post' })
        },
        { wait: 300 }
    )

    const autocompleteFilter: (idx: number) => AutoCompleteFilter = useCallback(
        (idx) =>
            (_, { value }) => {
                return form.values.members.indexOf(value) === -1
            },
        [form.values.members]
    )

    const handleAutocompleteChange = (idx: number) => (value: string) => {
        form.setFieldValue(`members.${idx}`, value)
        runSearch(value)
    }

    return (
        <div>
            <Breadcrumbs>
                <Anchor href={`/dashboard/organizations/${organizationId}`}>
                    {data.organization.name}
                </Anchor>
                <Text>Settings</Text>
            </Breadcrumbs>

            <br />

            <Form>
                <TextInput
                    label={'Name'}
                    placeholder={'ACME Corporation'}
                    {...form.getInputProps('name')}
                />
            </Form>
        </div>
    )
}

export function CatchBoundary() {
    const error = useCatch<ThrownResponses>()

    return (
        <Center
            component={'section'}
            sx={(theme) => ({
                backgroundColor:
                    theme.colorScheme === 'dark'
                        ? theme.fn.rgba(theme.colors.red[9], 0.5)
                        : theme.colors.red[4],
                height: '100%',
            })}
        >
            <Text weight={600} size={'xl'}>
                {error.status} {error.data}
            </Text>
        </Center>
    )
}
