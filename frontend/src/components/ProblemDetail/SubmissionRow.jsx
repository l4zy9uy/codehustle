import React from 'react';
import { Badge, Text, Table } from '@mantine/core';

function formatWhen(whenStr) {
  try {
    const d = new Date(whenStr);
    if (isNaN(d.getTime())) return whenStr || '';
    const now = new Date();
    const isToday = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
    if (isToday) {
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
  } catch {
    return whenStr || '';
  }
}

export default function SubmissionRow({ submission, onClick, children, index = 0 }) {
  const whenLabel = formatWhen(submission.when);
  const bg = index % 2 === 0 ? 'var(--mantine-color-white)' : 'var(--mantine-color-gray-0)';

  return (
    <>
      <Table.Tr
        onClick={onClick}
        style={{
          background: bg,
          cursor: 'pointer',
        }}
      >
        <Table.Td style={{ padding: '8px 12px' }}>
          <Badge variant="light" color="gray" radius="sm">{submission.status}</Badge>
        </Table.Td>
        <Table.Td style={{ padding: '8px 12px' }}>
          <Text size="sm" c="dimmed">{submission.lang}</Text>
        </Table.Td>
        <Table.Td style={{ padding: '8px 12px' }}>
          <Text size="sm" c="dimmed">{whenLabel}</Text>
        </Table.Td>
      </Table.Tr>
      {children && (
        <Table.Tr style={{ background: bg }}>
          <Table.Td colSpan={3} style={{ padding: 0 }}>
            {children}
          </Table.Td>
        </Table.Tr>
      )}
    </>
  );
}
