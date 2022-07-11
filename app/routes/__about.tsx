import {AppShell, Button, Center, Header, Text} from "@mantine/core";
import {NavLink, Outlet, useLoaderData, useNavigate} from "@remix-run/react";
import type {LoaderFunction} from "@remix-run/node";
import {json} from "@remix-run/node";
import {getUserSession} from "~/utils/session.server";

interface LoaderData {
  isAuthenticated: boolean
}

export const loader: LoaderFunction = async ({request}) => {
  const user = await getUserSession(request)
  return json({isAuthenticated: !!user.get('id')})
}

export default function AboutLayout() {
  const navigate = useNavigate()
  const data = useLoaderData<LoaderData>()

  function toLanding() {
    navigate('/', {replace: true})
  }

  return (
    <AppShell
      padding="md"
      header={
        <Header height={60} p="lg" style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Text weight={600} size={'lg'} onClick={toLanding} style={{cursor: 'pointer'}}>
            Monneh
          </Text>
          <Center sx={theme => ({gap: theme.spacing.sm, display: 'flex'})}>
            {data.isAuthenticated ? (
              <Button component={NavLink} to={'dashboard'} variant={'outline'}>Dashboard</Button>
            ) : (
              <>
                <Button component={NavLink} to={'login'} variant={'outline'}>Login</Button>
                <Button component={NavLink} to={'register'} variant={'gradient'}>Register</Button>
              </>
            )}
          </Center>
        </Header>
      }
      styles={{
        root: {
          height: '100vh',
          display: 'flex',
          flexDirection: 'column'
        },
        body: {
          flex: 1
        }
      }}
    >
      <Outlet/>
    </AppShell>
  );
}
