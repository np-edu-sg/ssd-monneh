/**
 * There is quite an amount of duplicated code on this page, copied from setup. This is because... well their functionality are mostly similar.
 */

import type { ActionFunction, LoaderFunction } from '@remix-run/node'
import { json } from '@remix-run/node'
import { requireUser } from '~/utils/session.server'
import invariant from 'tiny-invariant'
import {
    defaultRoles,
    requireAuthorization,
} from '~/utils/authorization.server'
import { db } from '~/utils/db.server'
import type { ThrownResponse } from '@remix-run/react'
import {
    Form,
    useActionData,
    useCatch,
    useLoaderData,
    useSubmit,
    useTransition,
} from '@remix-run/react'
import {
    ActionIcon,
    Autocomplete,
    Button,
    Card,
    Center,
    Group,
    ScrollArea,
    Select,
    Table,
    Text,
    TextInput,
} from '@mantine/core'
import { formList, useForm } from '@mantine/form'
import { useCallback, useEffect, useMemo } from 'react'
import { getValidationErrorObject } from '~/utils/validation.server'
import { Prisma } from '@prisma/client'
import * as z from 'zod'
import { Role } from '~/utils/roles'
import { showNotification } from '@mantine/notifications'
import { randomId } from '@mantine/hooks'
import { useDebounceFn } from 'ahooks'
import type { AutoCompleteFilter } from '~/components'
import { AutoCompleteItem, RoleSelectItem } from '~/components'
import { Plus, Trash } from 'tabler-icons-react'

// TODO: User search is duplicated across many places, should probably extract it
enum Action {
    UserSearch = 'user-search',
    UpdateOrganization = 'update-organization',
}

interface UserSearchActionData {
    readonly action: Action.UserSearch
    users: { label: string; value: string }[]
}

interface UpdateMembersActionData {
    readonly action: Action.UpdateOrganization
    errors?: Record<string, string>
}

type ActionData = UserSearchActionData | UpdateMembersActionData

const createUpdateMembersBodySchema = (requesterUsername: string) =>
    z.object({
        name: z.string().min(1, 'Name is required'),
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

        case Action.UpdateOrganization: {
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
                        action: Action.UpdateOrganization,
                        errors: {
                            members: 'Members must be a marshalled object',
                        },
                    })
                }
            }
            const result = await createUpdateMembersBodySchema(
                username
            ).safeParseAsync(object)
            if (!result.success) {
                // TODO - although there is a validation error response, it is not handled on the client because of the list nature
                return json<ActionData>({
                    action: Action.UpdateOrganization,
                    errors: getValidationErrorObject(result.error.issues),
                })
            }

            await requireAuthorization(
                username,
                organizationId,
                (role) => role.allowUpdateOrganization
            )

            await db.$transaction(async (prisma) => {
                await prisma.organization.update({
                    where: {
                        id: organizationId,
                    },
                    data: {
                        name: result.data.name,
                    },
                })
                await prisma.organizationToUser.deleteMany({
                    where: {
                        organizationId,
                        username: {
                            not: username,
                        },
                    },
                })

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
            })

            return json({})
        }
    }
}

interface LoaderData {
    username: string
    organization: {
        name: string
        users: { username: string; role: string }[]
    }
    roles: {
        id: string
        name: string
        description: string
    }[]
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
                    role: true,
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

    const users = organization.users.map(({ user: { username }, role }) => ({
        username,
        role,
    }))

    return json<LoaderData>({
        username,
        organization: {
            ...organization,
            users,
        },
        roles: Object.values(Role).map((key) => ({
            id: key,
            name: defaultRoles[key].name,
            description: defaultRoles[key].description,
        })),
    })
}

export default function OrganizationSettingsPage() {
    const submit = useSubmit()
    const transition = useTransition()
    const actionData = useActionData<ActionData>()
    const loaderData = useLoaderData<LoaderData>()

    useEffect(() => {
        if (actionData?.action !== Action.UpdateOrganization) return
        if (!actionData.errors) return

        showNotification({
            color: 'red',
            title: 'Error setting up',
            message: (
                <>
                    {Object.values(actionData.errors).map((v, idx) => (
                        <Text key={idx} size={'sm'}>
                            {v}
                        </Text>
                    ))}
                </>
            ),
        })
    }, [actionData])

    const form = useForm({
        initialValues: {
            name: loaderData.organization.name,
            members: formList<{
                username: string
                role: string
                key: string
            }>(
                loaderData.organization.users.map((v) => ({
                    ...v,
                    key: randomId(),
                }))
            ),
        },

        validate: {
            name: (value) =>
                value.length > 0 && value.length < 65
                    ? null
                    : 'Name length must be between 0 and 64',
            members: {
                username: (value) =>
                    value.length > 0 ? null : 'Username is required',
                role: (value) => (value.length > 0 ? null : 'Role is required'),
            },
        },
    })

    const roles = useMemo(
        () =>
            loaderData.roles.map(({ id, name, description }) => ({
                value: id,
                label: name,
                description,
            })),
        [loaderData.roles]
    )

    const { run: runSearch } = useDebounceFn(
        (search: string) => {
            submit({ search, action: Action.UserSearch }, { method: 'post' })
        },
        { wait: 300 }
    )

    const autocompleteFilter: (idx: number) => AutoCompleteFilter = useCallback(
        (idx) =>
            (_, { value }) => {
                return (
                    form.values.members
                        .map(({ username }, idx2) => idx !== idx2 && username)
                        .indexOf(value) === -1
                )
            },
        [form.values.members]
    )

    const handleAutocompleteChange = (idx: number) => (value: string) => {
        form.getListInputProps('members', idx, 'username').onChange(value)
        runSearch(value)
    }

    return (
        <div>
            <Text weight={600} size={'xl'} component={'h1'}>
                Organization settings
            </Text>

            <Form
                onSubmit={form.onSubmit(async (values) => {
                    submit(
                        {
                            ...values,
                            members: JSON.stringify(
                                values.members.filter(
                                    ({ username }) =>
                                        username !== loaderData.username
                                )
                            ),
                            action: Action.UpdateOrganization,
                        },
                        { method: 'post' }
                    )
                })}
            >
                <TextInput label={'Name'} {...form.getInputProps('name')} />
                <br />
                <Card>
                    <Group position={'apart'}>
                        <Text weight={600} size={'lg'}>
                            Members
                        </Text>

                        <Button
                            variant={'outline'}
                            onClick={() => {
                                form.addListItem('members', {
                                    username: '',
                                    role: Role.Member,
                                    key: randomId(),
                                })
                            }}
                        >
                            <Plus size={20} />
                        </Button>
                    </Group>

                    <br />

                    <ScrollArea offsetScrollbars scrollbarSize={10}>
                        <Table verticalSpacing={'sm'}>
                            <colgroup>
                                <col style={{ width: '55%', minWidth: 300 }} />
                                <col style={{ width: '40%', minWidth: 200 }} />
                                <col style={{ width: '5%' }} />
                            </colgroup>
                            <thead>
                                <tr>
                                    <th>Member</th>
                                    <th>Role</th>
                                    <th>Remove</th>
                                </tr>
                            </thead>
                            <tbody>
                                {form.values.members.map((item, idx) => (
                                    <tr key={item.key}>
                                        <td>
                                            <Autocomplete
                                                placeholder={
                                                    'Username or email'
                                                }
                                                disabled={
                                                    loaderData.username ===
                                                    item.username
                                                }
                                                itemComponent={AutoCompleteItem}
                                                filter={autocompleteFilter(idx)}
                                                data={
                                                    actionData?.action ===
                                                    Action.UserSearch
                                                        ? actionData.users
                                                        : []
                                                }
                                                {...form.getListInputProps(
                                                    'members',
                                                    idx,
                                                    'username'
                                                )}
                                                value={
                                                    form.getListInputProps(
                                                        'members',
                                                        idx,
                                                        'username'
                                                    ).value
                                                }
                                                onChange={handleAutocompleteChange(
                                                    idx
                                                )}
                                            />
                                        </td>
                                        <td>
                                            <Select
                                                data={roles}
                                                disabled={
                                                    loaderData.username ===
                                                    item.username
                                                }
                                                itemComponent={RoleSelectItem}
                                                {...form.getListInputProps(
                                                    'members',
                                                    idx,
                                                    'role'
                                                )}
                                            />
                                        </td>
                                        <td>
                                            <ActionIcon
                                                color={'red'}
                                                variant={'hover'}
                                                disabled={
                                                    loaderData.username ===
                                                    item.username
                                                }
                                                onClick={() =>
                                                    form.removeListItem(
                                                        'members',
                                                        idx
                                                    )
                                                }
                                            >
                                                <Trash size={16} />
                                            </ActionIcon>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </ScrollArea>
                </Card>

                <br />

                <Group position={'apart'}>
                    <Button type={'submit'}>Save</Button>
                </Group>
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
