import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Title, 
  Text, 
  Stack, 
  Group, 
  Badge, 
  Paper, 
  Table, 
  Button, 
  TextInput,
  Pagination,
  Box,
  Anchor,
  Container
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { getContests } from '../lib/api/contests';
import { contests as mockContests } from '../lib/api/mockData';
import { formatContestDate, formatWindowDuration } from '../utils/contestUtils';
import { usePageTitle } from '../hooks/usePageTitle';

export default function Contests() {
  const navigate = useNavigate();
  const [upcomingContests, setUpcomingContests] = useState([]);
  const [pastContests, setPastContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const pageSize = 10;

  usePageTitle('Contests');

  const normalizeContest = (contest) => ({
    id: contest.id,
    name: contest.name,
    start_time: contest.start_time || contest.startTime,
    end_time: contest.end_time || contest.endTime,
    time_limit: contest.time_limit ?? contest.timeLimitHours,
    is_mirror: contest.is_mirror ?? contest.isMirror,
    tags: contest.tags || [],
  });

  const applySegmentation = (contestsList) => {
    const now = new Date();
    const upcoming = contestsList.filter((c) => {
      const startDate = c.start_time ? new Date(c.start_time) : null;
      return startDate && startDate > now;
    });
    const past = contestsList.filter((c) => {
      const endDate = c.end_time ? new Date(c.end_time) : null;
      return endDate && endDate <= now;
    });
    return { upcoming, past };
  };

  useEffect(() => {
    setLoading(true);
    getContests({ page, page_size: pageSize, q: searchQuery })
      .then((res) => {
        const apiContests = (res.contests || []).map(normalizeContest);
        const source = apiContests.length ? apiContests : mockContests.map(normalizeContest);
        const segmented = applySegmentation(source);
        setUpcomingContests(segmented.upcoming);
        setPastContests(segmented.past);
        setTotalPages(Math.ceil((res.total || source.length) / pageSize));
      })
      .catch(() => {
        const fallback = mockContests.map(normalizeContest);
        const segmented = applySegmentation(fallback);
        setUpcomingContests(segmented.upcoming);
        setPastContests(segmented.past);
        setTotalPages(Math.ceil(fallback.length / pageSize));
      })
      .finally(() => setLoading(false));
  }, [page, searchQuery]);

  const handleVirtualJoin = (contestId, e) => {
    e.stopPropagation();
    navigate(`/contests/${contestId}`);
  };

  return (
    <Container size={1440} style={{ margin: '24px auto', paddingInline: '0px' }}>
      <Stack gap="lg">
        <Title order={1} fw={600}>Contests</Title>

      {/* Upcoming Contests Section */}
      <Box>
        <Title order={3} size="h4">Upcoming contests</Title>
        {loading ? (
          <Text size="sm" c="dimmed">Loading...</Text>
        ) : upcomingContests.length === 0 ? (
          <Text size="sm" c="dimmed">There are no scheduled contests at this time.</Text>
        ) : (
          <Paper withBorder radius="sm" p="sm">
            <Table striped highlightOnHover withRowBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Contest</Table.Th>
                  <Table.Th>Date</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {upcomingContests.map((contest) => (
                  <Table.Tr 
                    key={contest.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/contests/${contest.id}`)}
                  >
                    <Table.Td>
                      <Group gap="xs" align="center">
                        <Anchor
                          component="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/contests/${contest.id}`);
                          }}
                          style={{ textDecoration: 'none' }}
                        >
                          <Text size="sm" fw={500}>{contest.name}</Text>
                        </Anchor>
                        {contest.is_mirror && (
                          <Badge color="violet" variant="light" size="sm">mirror</Badge>
                        )}
                        <Button 
                          size="xs" 
                          variant="light"
                          onClick={(e) => handleVirtualJoin(contest.id, e)}
                        >
                          Virtual join
                        </Button>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap={2}>
                        <Text size="sm">
                          {contest.start_time && contest.end_time && (
                            <>
                              {formatContestDate(contest.start_time)} - {formatContestDate(contest.end_time)}
                            </>
                          )}
                        </Text>
                        {contest.time_limit && (
                          <Text size="xs" c="dimmed">
                            {formatWindowDuration(contest.time_limit)}
                          </Text>
                        )}
                      </Stack>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        )}
      </Box>

      {/* Past Contests Section */}
      <Box>
        <Title order={3} size="h4">Past contests</Title>
        
        {/* Pagination and Search */}
        <Group justify="space-between" wrap="wrap">
          {totalPages > 1 && (
            <Pagination
              value={page}
              onChange={setPage}
              total={totalPages}
              size="sm"
            />
          )}
          <TextInput
            placeholder="Search contests..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            style={{ flex: 1, maxWidth: 300 }}
            size="sm"
          />
        </Group>

        {loading ? (
          <Text size="sm" c="dimmed">Loading...</Text>
        ) : pastContests.length === 0 ? (
          <Text size="sm" c="dimmed">No past contests found.</Text>
        ) : (
          <Paper withBorder radius="sm" p="sm">
            <Table striped highlightOnHover withRowBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Contest</Table.Th>
                  <Table.Th>Date</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {pastContests.map((contest) => (
                  <Table.Tr 
                    key={contest.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/contests/${contest.id}`)}
                  >
                    <Table.Td>
                      <Group gap="xs" align="center">
                        <Anchor
                          component="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/contests/${contest.id}`);
                          }}
                          style={{ textDecoration: 'none' }}
                        >
                          <Text size="sm" fw={500}>{contest.name}</Text>
                        </Anchor>
                        {contest.is_mirror && (
                          <Badge color="violet" variant="light" size="sm">mirror</Badge>
                        )}
                        <Button 
                          size="xs" 
                          variant="light"
                          onClick={(e) => handleVirtualJoin(contest.id, e)}
                        >
                          Virtual join
                        </Button>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap={2}>
                        <Text size="sm">
                          {contest.start_time && contest.end_time && (
                            <>
                              {formatContestDate(contest.start_time)} - {formatContestDate(contest.end_time)}
                            </>
                          )}
                        </Text>
                        {contest.time_limit && (
                          <Text size="xs" c="dimmed">
                            {formatWindowDuration(contest.time_limit)}
                          </Text>
                        )}
                      </Stack>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        )}
      </Box>
      </Stack>
    </Container>
  );
}
