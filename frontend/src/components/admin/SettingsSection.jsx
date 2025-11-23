import React, { useState, useCallback } from 'react';
import { Stack, Card, Group, TextInput, PasswordInput, Switch, Button, Textarea, Title } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';

export default function SettingsSection() {
  const [smtpConfig, setSmtpConfig] = useState({
    server: '',
    port: '25',
    email: '',
    password: '',
    tls: false,
  });

  const [webConfig, setWebConfig] = useState({
    baseUrl: '',
    name: '',
    shortcut: '',
    footer: '',
    allowRegister: true,
    submissionShowAll: true,
  });

  const handleSaveSmtp = useCallback(() => {
    // TODO: wire up backend call
    console.log('Saving SMTP config', smtpConfig);
  }, [smtpConfig]);

  const handleSaveWeb = useCallback(() => {
    // TODO: wire up backend call
    console.log('Saving web config', webConfig);
  }, [webConfig]);

  return (
    <Stack gap="lg">
      <Card withBorder shadow="sm" radius="md" p="md">
        <Stack gap="md">
          <Title order={4}>SMTP Config</Title>
          <Group grow align="flex-start">
            <TextInput
              label="Server"
              required
              value={smtpConfig.server}
              onChange={(e) => setSmtpConfig((prev) => ({ ...prev, server: e.currentTarget.value }))}
              placeholder="smtp.example.com"
            />
            <TextInput
              label="Port"
              required
              value={smtpConfig.port}
              onChange={(e) => setSmtpConfig((prev) => ({ ...prev, port: e.currentTarget.value }))}
              placeholder="25"
            />
          </Group>
          <Group grow align="flex-start">
            <TextInput
              label="Email"
              required
              value={smtpConfig.email}
              onChange={(e) => setSmtpConfig((prev) => ({ ...prev, email: e.currentTarget.value }))}
              placeholder="email@example.com"
            />
            <PasswordInput
              label="Password"
              required
              value={smtpConfig.password}
              onChange={(e) => setSmtpConfig((prev) => ({ ...prev, password: e.currentTarget.value }))}
              placeholder="SMTP Server Password"
            />
          </Group>
          <Switch
            label="TLS"
            checked={smtpConfig.tls}
            onChange={(e) => setSmtpConfig((prev) => ({ ...prev, tls: e.currentTarget.checked }))}
          />
          <Button onClick={handleSaveSmtp} leftSection={<IconSend size={16} />} maw={120}>
            Save
          </Button>
        </Stack>
      </Card>

      <Card withBorder shadow="sm" radius="md" p="md">
        <Stack gap="md">
          <Title order={4}>Web Config</Title>
          <Group grow align="flex-start">
            <TextInput
              label="Base Url"
              required
              value={webConfig.baseUrl}
              onChange={(e) => setWebConfig((prev) => ({ ...prev, baseUrl: e.currentTarget.value }))}
              placeholder="http://127.0.0.1"
            />
            <TextInput
              label="Name"
              required
              value={webConfig.name}
              onChange={(e) => setWebConfig((prev) => ({ ...prev, name: e.currentTarget.value }))}
              placeholder="Online Judge"
            />
            <TextInput
              label="Shortcut"
              required
              value={webConfig.shortcut}
              onChange={(e) => setWebConfig((prev) => ({ ...prev, shortcut: e.currentTarget.value }))}
              placeholder="oj"
            />
          </Group>
          <Textarea
            label="Footer"
            required
            minRows={2}
            value={webConfig.footer}
            onChange={(e) => setWebConfig((prev) => ({ ...prev, footer: e.currentTarget.value }))}
            placeholder="Online Judge Footer"
          />
          <Group grow>
            <Switch
              label="Allow Register"
              checked={webConfig.allowRegister}
              onChange={(e) => setWebConfig((prev) => ({ ...prev, allowRegister: e.currentTarget.checked }))}
            />
            <Switch
              label="Submission List Show All"
              checked={webConfig.submissionShowAll}
              onChange={(e) => setWebConfig((prev) => ({ ...prev, submissionShowAll: e.currentTarget.checked }))}
            />
          </Group>
          <Button onClick={handleSaveWeb} leftSection={<IconSend size={16} />} maw={120}>
            Save
          </Button>
        </Stack>
      </Card>
    </Stack>
  );
}

