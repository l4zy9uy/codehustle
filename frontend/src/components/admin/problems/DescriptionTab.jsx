import React, { useState } from 'react';
import { Stack, Group, Text, Button, Paper, Title, Textarea } from '@mantine/core';
import { IconEye } from '@tabler/icons-react';
import DescriptionPreview from './DescriptionPreview';

export default function DescriptionTab({ description, updateDescription }) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <Text size="sm" c="dimmed">
          See our brief manual to learn about supported TeX commands.
        </Text>
        <Button 
          variant={showPreview ? "filled" : "outline"} 
          size="sm" 
          leftSection={<IconEye size={16} />}
          onClick={() => setShowPreview(!showPreview)}
        >
          {showPreview ? 'Edit' : 'Preview'}
        </Button>
      </Group>
      
      {!showPreview ? (
        <>
          <Paper withBorder p="md">
            <Title order={4} mb="md">Problem Description</Title>
            <Textarea
              placeholder="You are given two integers $a$ and $b$. Print $a+b$."
              value={description.legend}
              onChange={(e) => updateDescription('legend', e.target.value)}
              minRows={6}
              autosize
              radius="sm"
            />
          </Paper>

          <Paper withBorder p="md">
            <Title order={4} mb="md">Input format</Title>
            <Textarea
              placeholder="The only line of the input contains integers $a$ and $b$ ($-100 \\le a,b \\le 100$)."
              value={description.inputFormat}
              onChange={(e) => updateDescription('inputFormat', e.target.value)}
              minRows={4}
              autosize
              radius="sm"
            />
          </Paper>

          <Paper withBorder p="md">
            <Title order={4} mb="md">Output format</Title>
            <Textarea
              placeholder="Print $a+b$."
              value={description.outputFormat}
              onChange={(e) => updateDescription('outputFormat', e.target.value)}
              minRows={4}
              autosize
              radius="sm"
            />
          </Paper>

          <Paper withBorder p="md">
            <Title order={4} mb="md">Notes</Title>
            <Textarea
              placeholder="In the first example, $a=7$ and $b=8$. Thus, the answer is $a+b=7+8=15$."
              value={description.notes}
              onChange={(e) => updateDescription('notes', e.target.value)}
              minRows={4}
              autosize
              radius="sm"
            />
          </Paper>
        </>
      ) : (
        <DescriptionPreview description={description} />
      )}
    </Stack>
  );
}

