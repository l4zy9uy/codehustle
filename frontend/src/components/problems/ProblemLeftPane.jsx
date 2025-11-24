import React from 'react';
import { Paper, ScrollArea, Stack, Divider, Button, Box, Skeleton, Group } from '@mantine/core';
import { IconFileText, IconListCheck } from '@tabler/icons-react';
import { PANE_HEADER_H } from '../../constants/problems';

function PaneHeader({ children }) {
  return (
    <Box
      gap={4}
      wrap="nowrap"
      align="center"
      style={{ height: PANE_HEADER_H, borderBottom: 0, marginTop: 0, display: 'flex', alignItems: 'center' }}
    >
      {children}
    </Box>
  );
}

function TabButton({ active, onClick, leftSection, children }) {
  return (
    <Button
      variant="subtle"
      size="xs"
      color="gray"
      radius="xs"
      styles={{
        label: {
          fontWeight: active ? 600 : 200,
          color: active ? 'var(--mantine-color-gray-9)' : 'var(--mantine-color-dimmed)'
        }
      }}
      style={{
        fontWeight: active ? 600 : 200,
        height: PANE_HEADER_H,
        paddingInline: 8,
        fontSize: 'var(--mantine-font-size-sm)',
        lineHeight: 1,
        borderBottom: 0,
        borderRadius: 4,
        color: active ? 'var(--mantine-color-gray-9)' : 'var(--mantine-color-dimmed)',
      }}
      onClick={onClick}
      leftSection={leftSection}
    >
      {children}
    </Button>
  );
}

function PaneHeaderBar({ children }) {
  return (
    <Box style={{ padding: 4, background: 'var(--mantine-color-gray-0)' }}>
      {children}
    </Box>
  );
}

function LeftTabsHeader({ leftTab, setLeftTab }) {
  return (
    <PaneHeader>
      <TabButton
        active={leftTab === 'problem'}
        onClick={() => setLeftTab('problem')}
        leftSection={<IconFileText size={16} />}
      >
        Problem
      </TabButton>
      <Divider orientation="vertical" style={{ height: 18, alignSelf: 'center' }} />
      <TabButton
        active={leftTab === 'submissions'}
        onClick={() => setLeftTab('submissions')}
        leftSection={<IconListCheck size={16} />}
      >
        Submissions
      </TabButton>
    </PaneHeader>
  );
}

export default function ProblemLeftPane({ 
  leftTab, 
  setLeftTab, 
  loading
}) {
  return (
    <Paper withBorder p={0} radius="md" className="problem-content" style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* Left pane header: fixed, isolated from content padding */}
      <PaneHeaderBar>
        <LeftTabsHeader leftTab={leftTab} setLeftTab={setLeftTab} />
      </PaneHeaderBar>
      {/* Bleed right to align scrollbar with Paper border by offsetting content padding */}
      <ScrollArea
        style={{
          flex: 1,
          minHeight: 0,
          // Cancel Paper padding-right so scrollbar hugs the border
          marginRight: 'calc(-1 * var(--mantine-spacing-lg) + 16)',
        }}
      >
        <Stack gap="lg" style={{ padding: 'var(--mantine-spacing-lg)', paddingRight: 'var(--mantine-spacing-lg)' }}>
          {loading ? (
            <>
              <Skeleton height={28} width="60%" />
              <Group gap="sm">
                <Skeleton height={22} width={72} />
                <Skeleton height={22} width={80} />
              </Group>
              <Group gap="lg">
                <Skeleton height={18} width={120} />
                <Skeleton height={18} width={120} />
                <Skeleton height={18} width={120} />
              </Group>
              <Skeleton height={12} width="90%" />
              <Skeleton height={12} width="85%" />
              <Skeleton height={12} width="80%" />
            </>
          ) : leftTab === 'problem' ? (
            <div>
              {/* Content will be rendered by parent */}
            </div>
          ) : (
            <div>
              {/* Submissions will be rendered by parent */}
            </div>
          )}
        </Stack>
      </ScrollArea>
    </Paper>
  );
}

