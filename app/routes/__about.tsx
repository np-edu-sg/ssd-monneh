import {AppShell, Button, Center, Header, Text} from "@mantine/core";
import {Link, NavLink, Outlet, useNavigate} from "@remix-run/react";

export default function AboutLayout() {
  const navigate = useNavigate()

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
            <NavLink to={'login'}>
              <Button variant={'outline'}>Login</Button>
            </NavLink>
            <NavLink to={'register'}>
              <Button variant={'gradient'}>Register</Button>
            </NavLink>
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
