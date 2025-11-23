import React, { useState } from 'react';
import { Paper, Title, Stack, Grid, TextInput, Select, NumberInput, Group, Badge, Button, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';

export default function BasicInfoTab({ problemData, setProblemData }) {
  const [tagInput, setTagInput] = useState('');

  return (
    <Paper withBorder p="md">
      <Title order={4} mb="md">Basic Information</Title>
      <Stack gap="md">
        <Grid>
          <Grid.Col span={6}>
            <TextInput
              label="Name"
              placeholder="A+B"
              value={problemData.title}
              onChange={(e) => setProblemData(prev => ({ ...prev, title: e.target.value }))}
              required
              radius="sm"
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <Select
              label="Encoding"
              data={[
                { value: 'UTF-8', label: 'UTF-8' },
                { value: 'ASCII', label: 'ASCII' },
              ]}
              value={problemData.encoding}
              onChange={(value) => setProblemData(prev => ({ ...prev, encoding: value }))}
              radius="sm"
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <Select
              label="Difficulty"
              data={[
                { value: 'easy', label: 'Easy' },
                { value: 'medium', label: 'Medium' },
                { value: 'hard', label: 'Hard' },
              ]}
              value={problemData.difficulty}
              onChange={(value) => setProblemData(prev => ({ ...prev, difficulty: value }))}
              radius="sm"
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <NumberInput
              label="Time limit (ms)"
              value={problemData.timeLimit}
              onChange={(value) => setProblemData(prev => ({ ...prev, timeLimit: Number(value) || 0 }))}
              min={0}
              radius="sm"
            />
          </Grid.Col>
          <Grid.Col span={3}>
            <NumberInput
              label="Memory limit (MB)"
              value={problemData.memoryLimit}
              onChange={(value) => setProblemData(prev => ({ ...prev, memoryLimit: Number(value) || 0 }))}
              min={0}
              radius="sm"
            />
          </Grid.Col>
          <Grid.Col span={12}>
            <Stack gap="xs">
              <Text size="sm" fw={500}>Tags</Text>
              <Group gap="xs">
                {problemData.tags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="light" 
                    color="gray"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setProblemData(prev => ({ 
                      ...prev, 
                      tags: prev.tags.filter((_, i) => i !== index) 
                    }))}
                  >
                    {tag} ×
                  </Badge>
                ))}
              </Group>
              <Group gap="xs">
                <TextInput
                  placeholder="Add a tag"
                  value={tagInput ?? ''}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const next = (tagInput ?? '').trim();
                      if (!next) return;
                      setProblemData(prev => ({ ...prev, tags: [...prev.tags, next] }));
                      setTagInput('');
                    }
                  }}
                  style={{ flex: 1 }}
                  radius="sm"
                />
                <Button 
                  size="sm" 
                  leftSection={<IconPlus size={14} />} 
                  onClick={() => {
                    const next = (tagInput ?? '').trim();
                    if (!next) return;
                    setProblemData(prev => ({ ...prev, tags: [...prev.tags, next] }));
                    setTagInput('');
                  }}
                  radius="sm"
                >
                  Add
                </Button>
              </Group>
            </Stack>
          </Grid.Col>
        </Grid>
      </Stack>
    </Paper>
  );
}

