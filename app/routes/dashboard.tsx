import {
  ActionIcon,
  AppShell,
  Aside,
  Burger,
  Header,
  MediaQuery,
  Navbar,
  Text,
  useMantineColorScheme,
  useMantineTheme
} from "@mantine/core";
import {Outlet, useNavigate} from "@remix-run/react";
import {useState} from "react";
import {MoonStars, Sun} from "tabler-icons-react";

export default function DashboardLayout() {
  const navigate = useNavigate()
  const theme = useMantineTheme()

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
          <Text>Application navbar</Text>
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
