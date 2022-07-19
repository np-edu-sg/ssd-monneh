import { Outlet } from '@remix-run/react'
import type { ErrorBoundaryComponent } from '@remix-run/node'
import { Center, Stack, Text } from '@mantine/core'

export default function OrganizationsLayout() {
    return <Outlet />
}

export const ErrorBoundary: ErrorBoundaryComponent = ({ error }) => {
    return (
        <Center
            p={'lg'}
            component={'section'}
            sx={(theme) => ({
                backgroundColor:
                    theme.colorScheme === 'dark'
                        ? theme.fn.rgba(theme.colors.red[9], 0.5)
                        : theme.colors.red[4],
                height: '100%',
            })}
        >
            <Stack>
                <Text weight={600} size={'xl'}>
                    {error.name}
                </Text>
                <Text>{error.message}</Text>
            </Stack>
        </Center>
    )
}
