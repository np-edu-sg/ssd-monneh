import {useState} from "react";
import {
  ActionIcon,
  AppShell,
  Aside,
  Avatar,
  Burger,
  Button,
  Group,
  Header,
  MediaQuery,
  Navbar,
  Text,
  UnstyledButton,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import {Outlet, useLoaderData, useNavigate} from "@remix-run/react";
import {MoonStars, Sun} from "tabler-icons-react";
import type {LoaderFunction} from "@remix-run/node";
import {json} from "@remix-run/node";

import {db} from "~/utils/db.server";
import {requireUserId} from "~/utils/session.server";
import type {Organization} from '@prisma/client'

interface LoaderData {
  organizations: Organization[]
}

export const loader: LoaderFunction = async ({request}) => {
  const id = await requireUserId(request)
  const organizations = await db.organization.findMany({
    where: {
      users: {
        every: {
          id
        }
      }
    }
  })
  return json<LoaderData>({organizations})
}

export default function DashboardLayout() {
  const navigate = useNavigate()
  const theme = useMantineTheme()

  const data = useLoaderData<LoaderData>()

  const [opened, setOpened] = useState(false);
  const {colorScheme, toggleColorScheme} = useMantineColorScheme();

  const dark = colorScheme === 'dark'

  function toDashboard() {
    navigate('/dashboard', {replace: true})
  }

  return (
    <AppShell
      fixed
      padding="md"
      navbarOffsetBreakpoint="sm"
      asideOffsetBreakpoint="sm"
      styles={{
        root: {
          height: '100vh',
          display: 'flex',
          flexDirection: 'column'
        },
        body: {
          flex: 1
        },
        main: {
          background: dark ? theme.colors.dark[8] : theme.colors.gray[0],
        },
      }}
      header={
        <Header
          height={60}
          p="lg"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
          <MediaQuery largerThan="sm" styles={{display: 'none'}}>
            <Burger
              opened={opened}
              onClick={() => setOpened((o) => !o)}
              size="sm"
              color={theme.colors.gray[6]}
              mr="xl"
            />
          </MediaQuery>

          <Text weight={600} size={'lg'} onClick={toDashboard} style={{cursor: 'pointer'}}>
            Monneh <span style={{fontWeight: 400}}>Dashboard</span>
          </Text>

          <ActionIcon
            variant="outline"
            color={dark ? 'yellow' : 'blue'}
            onClick={() => toggleColorScheme()}
            title="Toggle color scheme"
          >
            {dark ? <Sun size={18}/> : <MoonStars size={18}/>}
          </ActionIcon>
        </Header>
      }
      navbar={
        <Navbar p="md" hiddenBreakpoint="sm" hidden={!opened} width={{sm: 200, lg: 300}}>
          <Text weight={600}>Your organizations</Text>
          <br/>
          {data.organizations.length === 0 ? (
            <Text>Nothing here... create one!</Text>
          ) : (
            <Group direction={'column'}>
              {data.organizations.map((organization, idx) => (
                <UnstyledButton onClick={() => console.log('try focusing button with tab')} key={idx} style={{
                  width: '100%'
                }}>
                  <Group>
                    <Avatar size={30} color="blue">{organization.name[0]}</Avatar>
                    <Text component={'span'} style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {organization.name}
                    </Text>
                  </Group>
                </UnstyledButton>
              ))}
            </Group>
          )}
          <br/>
          <div>
            <Button variant={'outline'}>New +</Button>
          </div>
        </Navbar>
      }
      aside={
        <MediaQuery smallerThan="sm" styles={{display: 'none'}}>
          <Aside p="md" hiddenBreakpoint="sm" width={{sm: 200, lg: 300}}>
            <Text>Application sidebar</Text>
          </Aside>
        </MediaQuery>
      }
    >
      <Outlet/>
    </AppShell>
  );
}
