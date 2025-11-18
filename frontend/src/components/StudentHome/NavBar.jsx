// src/components/NavBar.jsx
import React from 'react';
import {
  AppShell,
  Container,
  Group,
  Anchor,
  Menu,
  Avatar,
  UnstyledButton,
  Image,
  useMantineTheme,
  rem,
} from '@mantine/core';
import { useNavigate, NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { IconLogout, IconUser } from '@tabler/icons-react';
import logo from '../../assets/logo.svg';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useMantineTheme();
  const isAdmin = !!(user?.role === 'admin' || (Array.isArray(user?.roles) && user.roles.includes('admin')));
  const navLinks = [
    { label: 'Home', to: '/home' },
    { label: 'Problems', to: '/problems' },
    { label: 'Courses', to: '/courses' },
    { label: 'Contests', to: '/contests' },
  ];

  if (isAdmin) {
    navLinks.push({ label: 'Admin', to: '/admin' });
  }
  return (
    <AppShell.Header withBorder>
      <Container fluid px="md" style={{ height: '100%' }}>
        <Group h="100%" align="center" justify="space-between" gap="md" wrap="nowrap">
          <Group align="center" gap="lg" wrap="nowrap">
            <Anchor href="/home" underline="never" aria-label="CodeHustle home">
              <Image src={logo} alt="CodeHustle Logo" h={theme.spacing['3xl']} fit="contain" />
            </Anchor>
            {/* nav links */}
            {navLinks.map(({ label, to }) => {
              // Deactivate Problems link when on create/edit problem pages
              const isOnProblemEditor = location.pathname.startsWith('/problems/') && 
                                       (location.pathname.includes('/edit') || location.pathname.includes('/new'));
              const shouldBeActive = to === '/problems' && isOnProblemEditor ? false : undefined;
              
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => {
                    const actuallyActive = shouldBeActive === false ? false : isActive;
                    return `app-nav-link${actuallyActive ? ' app-nav-link-active' : ''}`;
                  }}
                  style={({ isActive }) => {
                    const actuallyActive = shouldBeActive === false ? false : isActive;
                    return {
                      display: 'inline-block',
                      fontWeight: actuallyActive ? 600 : 400,
                      color: actuallyActive ? theme.colors.blue[7] : 'var(--mantine-color-text)',
                      backgroundColor: actuallyActive ? theme.colors.blue[1] : 'transparent',
                      borderRadius: theme.radius.md,
                      padding: `${rem(theme.spacing.xs)} ${rem(theme.spacing.lg)}`,
                      textDecoration: 'none',
                      opacity: actuallyActive ? 1 : undefined,
                    };
                  }}
                >
                  {label}
                </NavLink>
              );
            })
            }
          </Group>

          {/* right side: avatar or sign in */}
          {user ? (
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <UnstyledButton>
                  <Avatar radius="xl">
                    {user.name?.[0] || user.email?.[0]}
                  </Avatar>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown>
                {user.name && <Menu.Label>Signed in as {user.name}</Menu.Label>}
                <Menu.Divider />
                <Menu.Label>Actions</Menu.Label>
                <Menu.Item icon={<IconUser size={16} />} onClick={() => navigate('/profile')}>
                  Profile
                </Menu.Item>
                <Menu.Item
                  icon={<IconLogout size={16} />}
                  color="red"
                  onClick={() => {
                    logout();
                    navigate('/login');
                  }}
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : (
            <Anchor
              href="/login"
              underline="never"
              className="app-nav-link"
              style={{
                display: 'inline-block',
                color: 'var(--mantine-color-text)',
                backgroundColor: 'transparent',
                borderRadius: theme.radius.md,
                padding: `${rem(theme.spacing.sm)} ${rem(theme.spacing.md)}`,
                textDecoration: 'none',
              }}
            >
              Login
            </Anchor>
          )}
        </Group>
      </Container>
    </AppShell.Header>
  );
}
