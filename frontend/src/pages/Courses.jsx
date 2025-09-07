import React, { useEffect, useMemo, useState } from 'react';
import { Table, Title, ScrollArea, Group, Button, Paper, Divider, Text, Badge } from '@mantine/core';
import { useNavigate } from 'react-router-dom';
import { IconChevronUp, IconChevronDown } from '@tabler/icons-react';
import { getCourses } from '../lib/api/courses';


export default function Courses() {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState('title');
  const [sortDir, setSortDir] = useState('asc');
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    getCourses()
      .then((res) => setCourses(res.items || []))
      .catch(() => setCourses([]));
  }, []);

  const toggleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  };

  const sortedCourses = useMemo(() => {
    return [...courses].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [courses, sortBy, sortDir]);

  return (
    <>
      <Title order={2} mb="md">Courses</Title>
      <Paper withBorder radius="sm" p="sm">
        <Divider mb="xs" />
        <ScrollArea.Autosize mah={400}>
          <Table striped highlightOnHover withRowBorders horizontalSpacing="md" verticalSpacing="sm">
            <Table.Thead>
              <Table.Tr>
                <Table.Th>#</Table.Th>
                {['title', 'lecturer', 'startDate', 'endDate'].map((key) => {
                  const labelMap = {
                    title: 'Course Name',
                    lecturer: 'Lecturer',
                    startDate: 'Start Date',
                    endDate: 'End Date',
                  };
                  const isActive = sortBy === key;
                  return (
                    <Table.Th
                      key={key}
                      onClick={() => toggleSort(key)}
                      style={{ cursor: 'pointer', backgroundColor: isActive ? 'var(--mantine-color-blue-0)' : undefined }}
                    >
                      <Group spacing={4} align="center">
                        <Text weight={isActive ? 'bold' : 'normal'} size="sm">{labelMap[key]}</Text>
                        {isActive && (sortDir === 'asc' ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />)}
                      </Group>
                    </Table.Th>
                  );
                })}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
                {sortedCourses.map((c, idx) => {
                  const isExpired = new Date(c.endDate) < new Date();
                  return (
                    <Table.Tr key={c.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/courses/${c.id}`)}>
                      <Table.Td>{idx + 1}</Table.Td>
                      <Table.Td>{c.title}</Table.Td>
                      <Table.Td>{c.lecturer}</Table.Td>
                      <Table.Td>{c.startDate}</Table.Td>
                      <Table.Td>
                        <Group spacing="xs" align="center">
                          <Text color={isExpired ? 'red' : undefined} size="sm">{c.endDate}</Text>
                          {isExpired && <Badge color="red" variant="light" size="xs">Expired</Badge>}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
            </Table.Tbody>
          </Table>
        </ScrollArea.Autosize>
      </Paper>
      <Group spacing="xs" mt="md">
        <Button variant="subtle" size="xs">Prev</Button>
        <Button variant="subtle" size="xs">1</Button>
        <Button variant="subtle" size="xs">2</Button>
        <Button variant="subtle" size="xs">3</Button>
        <Button variant="subtle" size="xs">Next</Button>
      </Group>
    </>
  );
} 
