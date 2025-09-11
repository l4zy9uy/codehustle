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
import { useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { IconLogout, IconUser } from '@tabler/icons-react';
import logo from '../../assets/logo.svg';

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useMantineTheme();
  return (
    <AppShell.Header withBorder>
      <Container fluid px="md" style={{ height: '100%' }}>
        <Group h="100%" align="center" justify="space-between" gap="md" wrap="nowrap">
          <Group align="center" gap="lg" wrap="nowrap">
            <Anchor href="/home" underline="never" aria-label="CodeHustle home">
              <Image src={logo} alt="CodeHustle Logo" h={theme.spacing['3xl']} fit="contain" />
            </Anchor>
            {/* nav links */}
            {[
              { label: 'Home', to: '/home' },
              { label: 'Problems', to: '/problems' },
              { label: 'Courses', to: '/courses' },
            ].map(({ label, to }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `app-nav-link${isActive ? ' app-nav-link-active' : ''}`}
                style={({ isActive }) => ({
                  display: 'inline-block',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? theme.colors.blue[7] : 'var(--mantine-color-text)',
                  backgroundColor: isActive ? theme.colors.blue[1] : 'transparent',
                  borderRadius: theme.radius.md,
                  padding: `${rem(theme.spacing.xs)} ${rem(theme.spacing.lg)}`,
                  textDecoration: 'none',
                  opacity: isActive ? 1 : undefined,
                })}
              >
                {label}
              </NavLink>
            ))
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
