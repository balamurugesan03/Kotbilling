import { AppShell as MantineAppShell, ScrollArea } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';

const AppShell = () => {
  const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);

  return (
    <MantineAppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
      }}
      padding={{ base: 'xs', sm: 'md' }}
    >
      <MantineAppShell.Header>
        <Header mobileOpened={mobileOpened} toggleMobile={toggleMobile} />
      </MantineAppShell.Header>

      <MantineAppShell.Navbar bg="dark.8" style={{ borderRight: '1px solid var(--mantine-color-dark-5)' }}>
        <MantineAppShell.Section grow component={ScrollArea}>
          <Sidebar />
        </MantineAppShell.Section>
      </MantineAppShell.Navbar>

      <MantineAppShell.Main>
        <Outlet />
      </MantineAppShell.Main>
    </MantineAppShell>
  );
};

export default AppShell;
