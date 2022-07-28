import type { ThrownResponse } from '@remix-run/react'
import {
    Form,
    useActionData,
    useCatch,
    useLoaderData,
    useSubmit,
    useTransition,
} from '@remix-run/react'
import { formList, useForm } from '@mantine/form'
import type { ComponentPropsWithoutRef } from 'react'
import { forwardRef, useCallback, useEffect, useMemo } from 'react'
import { useDebounceFn } from 'ahooks'
import type { SelectItemProps } from '@mantine/core'
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
} from '@mantine/core'
import { randomId } from '@mantine/hooks'
import { Plus, Trash } from 'tabler-icons-react'
import type { ActionFunction, LoaderFunction } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'
import { showNotification } from '@mantine/notifications'
import invariant from 'tiny-invariant'
import * as z from 'zod'

import { db } from '~/utils/db.server'
import { requireUser } from '~/utils/session.server'
import { getValidationErrorObject } from '~/utils/validation.server'
import {
    defaultRoles,
    requireAuthorization,
} from '~/utils/authorization.server'
import { Role } from '~/utils/roles'

import { Prisma } from '@prisma/client'
import type { AutoCompleteFilter } from '~/components'
import { AutoCompleteItem } from '~/components'

enum Action {
    UserSearch = 'user-search',
    AddMembers = 'add-members',
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

    const organizationId = parseInt(params.organizationId) || 0
    await requireAuthorization(
        username,
        organizationId,
        (role) => role.allowUpdateOrganization
    )

    const organization = await db.organization.findUnique({
        where: {
            id: organizationId,
        },
    })

    if (!organization) {
        return redirect(`/dashboard`)
    }

    if (organization.completedSetup) {
        return redirect(`/dashboard/organizations/${params.organizationId}`)
    }

    return json<LoaderData>({
        roles: Object.values(Role).map((key) => ({
            id: key,
            name: defaultRoles[key].name,
            description: defaultRoles[key].description,
        })),
    })
}

interface ItemProps extends SelectItemProps, ComponentPropsWithoutRef<'div'> {
    description: string
}

const RoleSelectItem = forwardRef<HTMLDivElement, ItemProps>(
    ({ label, description, ...others }: ItemProps, ref) => (
        <div ref={ref} {...others}>
            <Group noWrap>
                <div>
                    <Text size={'sm'}>{label}</Text>
                    <Text size={'xs'} color={'dimmed'}>
                        {description}
                    </Text>
                </div>
            </Group>
        </div>
    )
)

export default function OrganizationSetupPage() {
    const submit = useSubmit()
    const transition = useTransition()
    const actionData = useActionData<ActionData>()
    const loaderData = useLoaderData<LoaderData>()

    useEffect(() => {
        if (actionData?.action !== Action.AddMembers) return
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
            members: formList<{
                username: string
                role: string
                key: string
            }>([
                {
                    username: '',
                    role: Role.Member,
                    key: randomId(),
                },
            ]),
        },

        validate: {
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

    const skipSetup = () => {
        submit(
            {
                members: '[]',
                action: Action.AddMembers,
            },
            { method: 'post' }
        )
    }

    return (
        <div>
            <Text weight={600} size={'xl'} component={'h1'}>
                Setup your organization!
            </Text>

            <Form
                onSubmit={form.onSubmit(async (values) => {
                    submit(
                        {
                            members: JSON.stringify(values.members),
                            action: Action.AddMembers,
                        },
                        { method: 'post' }
                    )
                })}
            >
                <Card>
                    <Group position={'apart'}>
                        <Text weight={600} size={'lg'}>
                            Add your teammates
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
                    <Button
                        variant={'outline'}
                        type={'button'}
                        onClick={skipSetup}
                    >
                        Skip
                    </Button>
                    <Button type={'submit'}>Continue</Button>
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
