import React, { useState } from 'react';
import {
  ActionIcon,
  Button,
  Box,
  Container,
  Grid,
  Group,
  Paper,
  Radio,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { Editor } from '@tinymce/tinymce-react';
import { createContest } from '../../lib/api/contests';

const defaultEditorInit = {
  height: 320,
  menubar: false,
  plugins: 'advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table code help wordcount',
  toolbar:
    'undo redo | formatselect | bold italic underline forecolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | code',
  content_style: 'body { font-family: Inter, Helvetica, Arial, sans-serif; font-size: 14px; }',
};

export default function ContestCreate({ embedded = false, onSuccess = null, onCancel = null }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [password, setPassword] = useState('');
  const [ruleType, setRuleType] = useState('ACM');
  const [realTimeRank, setRealTimeRank] = useState(true);
  const [statusActive, setStatusActive] = useState(true);
  const [allowedIps, setAllowedIps] = useState(['']);
  const [submitting, setSubmitting] = useState(false);

  const handleAddIpRow = () => setAllowedIps((prev) => [...prev, '']);
  const handleRemoveIpRow = (index) =>
    setAllowedIps((prev) => prev.filter((_, idx) => idx !== index));
  const handleIpChange = (index, value) =>
    setAllowedIps((prev) => prev.map((ip, idx) => (idx === index ? value : ip)));

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartTime('');
    setEndTime('');
    setPassword('');
    setRuleType('ACM');
    setRealTimeRank(true);
    setStatusActive(true);
    setAllowedIps(['']);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!title.trim()) {
      notifications.show({ title: 'Missing title', message: 'Please enter a contest title.', color: 'red' });
      return;
    }
    if (!description.trim()) {
      notifications.show({
        title: 'Missing description',
        message: 'Please provide a contest description.',
        color: 'red',
      });
      return;
    }
    if (!startTime || !endTime) {
      notifications.show({
        title: 'Missing schedule',
        message: 'Start time and end time are required.',
        color: 'red',
      });
      return;
    }
    if (new Date(startTime) >= new Date(endTime)) {
      notifications.show({
        title: 'Invalid schedule',
        message: 'End time must be later than start time.',
        color: 'red',
      });
      return;
    }

    const payload = {
      name: title.trim(),
      description,
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      password: password.trim() || undefined,
      rule_type: ruleType,
      real_time_rank: realTimeRank,
      is_active: statusActive,
      allowed_ip_ranges: allowedIps.filter((range) => range.trim().length),
    };

    setSubmitting(true);
    try {
      await createContest(payload);
      notifications.show({
        title: 'Contest created',
        message: 'Your contest has been created successfully.',
        color: 'teal',
      });
      resetForm();
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/contests');
      }
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to create contest. Please try again.';
      notifications.show({
        title: 'Creation failed',
        message,
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }
    navigate(-1);
  };

  const content = (
    <Stack gap="xl">
      <Group justify="space-between">
        <div>
          <Title order={2}>Create Contest</Title>
          <Text c="dimmed">Configure contest details, schedule, and restrictions.</Text>
        </div>
        {!embedded && (
          <Button variant="subtle" onClick={handleCancel}>
            Cancel
          </Button>
        )}
      </Group>

      <Paper component="form" withBorder radius="md" p="xl" onSubmit={handleSubmit}>
        <Stack gap="xl">
          <div>
            <Text fw={600} size="sm">
              Title{' '}
              <Text span c="red">
                *
              </Text>
            </Text>
            <TextInput
              placeholder="Contest title"
              value={title}
              onChange={(event) => setTitle(event.currentTarget.value)}
              required
            />
          </div>

          <div>
            <Text fw={600} size="sm" mb={6}>
              Description{' '}
              <Text span c="red">
                *
              </Text>
            </Text>
            <Editor
              apiKey={import.meta.env.VITE_TINYMCE_API_KEY || 'no-api-key'}
              value={description}
              onEditorChange={setDescription}
              init={defaultEditorInit}
            />
          </div>

          <Grid>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Text fw={600} size="sm">
                Start Time{' '}
                <Text span c="red">
                  *
                </Text>
              </Text>
              <TextInput
                type="datetime-local"
                value={startTime}
                onChange={(event) => setStartTime(event.currentTarget.value)}
                required
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Text fw={600} size="sm">
                End Time{' '}
                <Text span c="red">
                  *
                </Text>
              </Text>
              <TextInput
                type="datetime-local"
                value={endTime}
                onChange={(event) => setEndTime(event.currentTarget.value)}
                required
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Text fw={600} size="sm">
                Password
              </Text>
              <TextInput
                placeholder="Optional password"
                value={password}
                onChange={(event) => setPassword(event.currentTarget.value)}
              />
            </Grid.Col>
          </Grid>

          <Grid align="center">
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Text fw={600} size="sm" mb={6}>
                Contest Rule Type
              </Text>
              <Radio.Group value={ruleType} onChange={setRuleType}>
                <Stack gap={6}>
                  <Radio value="ACM" label="ACM" />
                  <Radio value="OI" label="OI" />
                </Stack>
              </Radio.Group>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Text fw={600} size="sm" mb={6}>
                Real Time Rank
              </Text>
              <Switch
                size="lg"
                checked={realTimeRank}
                onChange={(event) => setRealTimeRank(event.currentTarget.checked)}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Text fw={600} size="sm" mb={6}>
                Status
              </Text>
              <Switch
                size="lg"
                checked={statusActive}
                onChange={(event) => setStatusActive(event.currentTarget.checked)}
                onLabel="Active"
                offLabel="Draft"
              />
            </Grid.Col>
          </Grid>

          <Stack gap="sm">
            <Group justify="space-between">
              <div>
                <Text fw={600} size="sm">
                  Allowed IP Ranges
                </Text>
                <Text size="xs" c="dimmed">
                  Provide CIDR networks (e.g. 10.0.0.0/24). Leave blank to allow all.
                </Text>
              </div>
              <Button
                leftSection={<IconPlus size={16} />}
                variant="light"
                size="xs"
                onClick={handleAddIpRow}
              >
                Add range
              </Button>
            </Group>
            <Stack gap="sm">
              {allowedIps.map((value, index) => (
                <Group key={`ip-${index}`} align="center" gap="xs">
                  <TextInput
                    placeholder="CIDR Network"
                    value={value}
                    onChange={(event) => handleIpChange(index, event.currentTarget.value)}
                    style={{ flex: 1 }}
                  />
                  {allowedIps.length > 1 && (
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label="Remove IP range"
                      onClick={() => handleRemoveIpRow(index)}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  )}
                </Group>
              ))}
            </Stack>
          </Stack>

          <Group justify="flex-end">
            <Button type="submit" loading={submitting}>
              Save
            </Button>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );

  if (embedded) {
    return <Box>{content}</Box>;
  }

  return (
    <Container size={900} my="xl">
      {content}
    </Container>
  );
}

