import { useMemo, useState } from 'react'
import {
    ActionIcon,
    AppShell,
    Avatar,
    Burger,
    Button,
    Center,
    Group,
    Header,
    MediaQuery,
    Navbar,
    ScrollArea,
    Stack,
    Text,
    UnstyledButton,
    useMantineColorScheme,
    useMantineTheme,
} from '@mantine/core'
import {
    NavLink,
    Outlet,
    useLoaderData,
    useNavigate,
    useParams,
} from '@remix-run/react'
import { MoonStars, Sun } from 'tabler-icons-react'
import type { LoaderFunction } from '@remix-run/node'
import { json, redirect } from '@remix-run/node'

import { db } from '~/utils/db.server'
import type { UserSessionData } from '~/utils/session.server'
import { requireUser } from '~/utils/session.server'

interface LoaderData {
    organizations: { id: number; name: string }[]
    user: UserSessionData
}

export const loader: LoaderFunction = async ({ request, params }) => {
    const user = await requireUser(request)

    const organizations = await db.organizationToUser.findMany({
        include: {
            organization: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
        where: {
            username: user.username,
        },
    })
    return json<LoaderData>({
        organizations: organizations.map(({ organization }) => organization),
        user,
    })
}

export default function DashboardLayout() {
    const theme = useMantineTheme()
    const { colorScheme, toggleColorScheme } = useMantineColorScheme()

    const params = useParams()
    const navigate = useNavigate()
    const data = useLoaderData<LoaderData>()

    const [opened, setOpened] = useState(false)

    const currentOrganizationId = useMemo(() => {
        if (!params.organizationId) return
        return parseInt(params.organizationId, 10)
    }, [params])

    const toDashboard = () => navigate('/dashboard', { replace: true })
    const toggleNavbar = () => setOpened((o) => !o)

    const dark = useMemo(() => colorScheme === 'dark', [colorScheme])

    return (
        <AppShell
            fixed
            padding={'md'}
            navbarOffsetBreakpoint={'sm'}
            asideOffsetBreakpoint={'sm'}
            styles={{
                root: {
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                },
                body: {
                    flex: 1,
                },
                main: {
                    background: dark
                        ? theme.colors.dark[8]
                        : theme.colors.gray[0],
                },
            }}
            header={
                <Header
                    height={60}
                    p={'lg'}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                    }}
                >
                    <MediaQuery largerThan={'sm'} styles={{ display: 'none' }}>
                        <Burger
                            title={'Menu'}
                            opened={opened}
                            onClick={toggleNavbar}
                            size={'sm'}
                            color={theme.colors.gray[6]}
                            mr={'xl'}
                        />
                    </MediaQuery>

                    <Text
                        weight={600}
                        size={'lg'}
                        onClick={toDashboard}
                        style={{ cursor: 'pointer' }}
                    >
                        Monneh{' '}
                        <span style={{ fontWeight: 400 }}>Dashboard</span>
                    </Text>

                    <ActionIcon
                        variant={'outline'}
                        color={dark ? 'yellow' : 'blue'}
                        onClick={() => toggleColorScheme()}
                        title={'Toggle color scheme'}
                    >
                        {dark ? <Sun size={18} /> : <MoonStars size={18} />}
                    </ActionIcon>
                </Header>
            }
            navbar={
                <Navbar
                    p={'md'}
                    hiddenBreakpoint={'sm'}
                    hidden={!opened}
                    width={{ sm: 200, lg: 300 }}
                >
                    <Text weight={600}>My organizations</Text>
                    <br />
                    <ScrollArea scrollbarSize={10}>
                        <Stack
                            sx={(theme) => ({
                                paddingTop: theme.spacing.sm,
                                paddingBottom: theme.spacing.sm,
                            })}
                        >
                            {data.organizations.length === 0 ? (
                                <Text>Nothing here... create one!</Text>
                            ) : (
                                <Stack justify={'space-between'}>
                                    {data.organizations.map(
                                        (organization, idx) => (
                                            <UnstyledButton
                                                key={idx}
                                                component={NavLink}
                                                to={`/dashboard/organizations/${organization.id}`}
                                                style={{
                                                    width: '100%',
                                                }}
                                                onClick={toggleNavbar}
                                            >
                                                <Group grow={false} noWrap>
                                                    <Avatar
                                                        size={30}
                                                        color={
                                                            currentOrganizationId ===
                                                            organization.id
                                                                ? 'violet'
                                                                : 'gray'
                                                        }
                                                    >
                                                        {organization.name[0]}
                                                    </Avatar>
                                                    <Text
                                                        component={'span'}
                                                        color={
                                                            currentOrganizationId ===
                                                            organization.id
                                                                ? 'violet'
                                                                : 'gray'
                                                        }
                                                        style={{
                                                            overflow: 'hidden',
                                                            textOverflow:
                                                                'ellipsis',
                                                            whiteSpace:
                                                                'nowrap',
                                                        }}
                                                    >
                                                        {organization.name}
                                                    </Text>
                                                </Group>
                                            </UnstyledButton>
                                        )
                                    )}
                                </Stack>
                            )}
                            <Center inline>
                                <Button
                                    component={NavLink}
                                    to={'/dashboard/organizations/new'}
                                    variant={'subtle'}
                                    onClick={toggleNavbar}
                                >
                                    New +
                                </Button>
                            </Center>
                        </Stack>
                    </ScrollArea>

                    <Group
                        style={{ flex: 1 }}
                        align={'flex-end'}
                        sx={(theme) => ({ paddingTop: theme.spacing.sm })}
                    >
                        <UnstyledButton
                            component={NavLink}
                            to={'/dashboard/profile'}
                            style={{ width: '100%' }}
                            onClick={toggleNavbar}
                        >
                            <Group
                                noWrap
                                style={{ width: '100%', cursor: 'pointer' }}
                                align={'center'}
                            >
                                <Avatar size={30} color={'blue'}>
                                    {data.user.username[0]}
                                </Avatar>
                                <Text
                                    component={'span'}
                                    style={{
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {data.user.firstName} {data.user.lastName}
                                </Text>
                            </Group>
                        </UnstyledButton>
                    </Group>
                </Navbar>
            }
        >
            <Outlet />
        </AppShell>
    )
}
