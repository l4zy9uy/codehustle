import React, { useMemo, useState } from 'react';
import {
  Anchor,
  Button,
  Checkbox,
  Container,
  FileInput,
  Grid,
  Group,
  NumberInput,
  Paper,
  ScrollArea,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  Accordion,
} from '@mantine/core';
import api from '../../lib/apiClient';

function generateSlug(base) {
  return String(base || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 24);
}

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
  let out = '';
  for (let i = 0; i < 12; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const cols = line.split(',');
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (cols[i] || '').trim(); });
    return obj;
  });
  return { headers, rows };
}

export default function AdminSettings() {
  // Problems & taxonomy
  const [defaultTimeLimitMs, setDefaultTimeLimitMs] = useState(1000);
  const [defaultMemoryLimitMb, setDefaultMemoryLimitMb] = useState(256);
  const [difficultyOrder, setDifficultyOrder] = useState(['easy', 'medium', 'hard']);
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState(['math', 'implementation']);

  // Announcements
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');

  // Featured content
  const [featuredProblems, setFeaturedProblems] = useState([]);
  const [featuredCourses, setFeaturedCourses] = useState([]);

  // Courses
  const [allowCourseCreation, setAllowCourseCreation] = useState(true);

  // Bulk accounts (CSV)
  const [csvFile, setCsvFile] = useState(null);
  const [csvData, setCsvData] = useState({ headers: [], rows: [] });
  const [mapping, setMapping] = useState({ email: 'email', studentId: 'student_id', name: 'name', username: 'username', password: 'password' });
  const [selectedContest, setSelectedContest] = useState(null);
  const [forceResetPasswords, setForceResetPasswords] = useState(false);
  const [results, setResults] = useState([]);
  // Sidebar open section controls which content is shown (exclusive)
  const [openSection, setOpenSection] = useState('problems');

  const csvHasRequired = useMemo(() => {
    return mapping.email && mapping.studentId;
  }, [mapping]);

  const handleCsvUpload = async (file) => {
    setCsvFile(file);
    setResults([]);
    if (!file) { setCsvData({ headers: [], rows: [] }); return; }
    const text = await file.text();
    const parsed = parseCsv(text);
    setCsvData(parsed);
    // Try auto-map known headers if present
    const lower = parsed.headers.map(h => h.toLowerCase());
    setMapping(prev => ({
      email: lower.includes('email') ? 'email' : prev.email,
      studentId: lower.includes('student_id') ? 'student_id' : prev.studentId,
      name: lower.includes('name') ? 'name' : prev.name,
      username: lower.includes('username') ? 'username' : prev.username,
      password: lower.includes('password') ? 'password' : prev.password,
    }));
  };

  const previewRows = useMemo(() => {
    const { headers, rows } = csvData;
    if (!headers.length) return [];
    return rows.slice(0, 20);
  }, [csvData]);

  const [submitting, setSubmitting] = useState(false);
  const handleGenerateAccounts = async () => {
    if (!csvHasRequired || !csvData.rows.length) return;
    setSubmitting(true);
    try {
      const payload = {
        rows: csvData.rows.map((row) => ({
          email: row[mapping.email] || '',
          student_id: row[mapping.studentId] || '',
          name: mapping.name ? (row[mapping.name] || '') : '',
          username: mapping.username ? (row[mapping.username] || '') : '',
          password: mapping.password ? (row[mapping.password] || '') : '',
        })),
        contest: selectedContest,
        options: { forceResetPasswords },
      };
      const resp = await api.post('/admin/bulk-accounts', payload);
      const generated = resp?.data?.results || [];
      setResults(generated);
    } catch (e) {
      setResults([]);
    } finally {
      setSubmitting(false);
    }
  };

  const downloadCredentialsCsv = () => {
    if (!results.length) return;
    const header = 'email,student_id,username,password\n';
    const body = results.map(r => `${r.email},${r.studentId},${r.username},${r.password}`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'credentials.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Container size="xl" py="md">
      <Grid gutter="xl">
        <Grid.Col span={3}>
          <Stack gap="xs" style={{ position: 'sticky', top: 12, paddingRight: 16 }}>
            <Text fw={600} c="dimmed">Settings</Text>
            <Accordion value={openSection} onChange={setOpenSection}>
              <Accordion.Item value="problems">
                <Accordion.Control>Problems & Taxonomy</Accordion.Control>
                <Accordion.Panel>
                  <Stack gap={4}>
                    <Anchor href="#problems-taxonomy-defaults" onClick={(e) => { e.preventDefault(); setOpenSection('problems'); document.getElementById('problems-taxonomy-defaults')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>Defaults & difficulties</Anchor>
                    <Anchor href="#problems-taxonomy-tags" onClick={(e) => { e.preventDefault(); setOpenSection('problems'); document.getElementById('problems-taxonomy-tags')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>Tags</Anchor>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="announcements">
                <Accordion.Control>Announcements</Accordion.Control>
                <Accordion.Panel>
                  <Stack gap={4}>
                    <Anchor href="#announcements" onClick={(e) => { e.preventDefault(); setOpenSection('announcements'); document.getElementById('announcements')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>Manage announcements</Anchor>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="featured">
                <Accordion.Control>Featured Content</Accordion.Control>
                <Accordion.Panel>
                  <Stack gap={4}>
                    <Anchor href="#featured" onClick={(e) => { e.preventDefault(); setOpenSection('featured'); document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>Manage featured</Anchor>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="courses">
                <Accordion.Control>Courses</Accordion.Control>
                <Accordion.Panel>
                  <Stack gap={4}>
                    <Anchor href="#courses" onClick={(e) => { e.preventDefault(); setOpenSection('courses'); document.getElementById('courses')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>Course options</Anchor>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
              <Accordion.Item value="bulk-accounts">
                <Accordion.Control>Bulk Accounts (CSV)</Accordion.Control>
                <Accordion.Panel>
                  <Stack gap={4}>
                    <Anchor href="#bulk-accounts" onClick={(e) => { e.preventDefault(); setOpenSection('bulk-accounts'); document.getElementById('bulk-accounts')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>Upload & generate</Anchor>
                  </Stack>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </Stack>
        </Grid.Col>

        <Grid.Col span={9}>
          <Stack gap="lg">
            {openSection === 'problems' && (
            <Paper withBorder p="md" id="problems-taxonomy">
              <Title order={3} mb="sm">Problems & Taxonomy</Title>
                  <Grid>
                    <Grid.Col span={12}>
                      <Text fw={600} id="problems-taxonomy-defaults">Default limits & difficulties</Text>
                    </Grid.Col>
                <Grid.Col span={6}>
                  <NumberInput label="Default time limit (ms)" value={defaultTimeLimitMs} onChange={setDefaultTimeLimitMs} min={0} />
                </Grid.Col>
                <Grid.Col span={6}>
                  <NumberInput label="Default memory limit (MB)" value={defaultMemoryLimitMb} onChange={setDefaultMemoryLimitMb} min={0} />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Select label="Difficulty order" data={['easy', 'medium', 'hard']} value={difficultyOrder[0]} onChange={(val) => val && setDifficultyOrder([val, ...difficultyOrder.filter(x => x !== val)])} />
                </Grid.Col>
                    <Grid.Col span={12}>
                      <Text fw={600} mt="md" id="problems-taxonomy-tags">Tags</Text>
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <Group>
                        <TextInput label="Add tag" placeholder="e.g. graphs" value={newTag} onChange={(e) => setNewTag(e.target.value)} />
                        <Button onClick={() => { const t = (newTag || '').trim(); if (!t) return; setTags(prev => prev.includes(t) ? prev : [...prev, t]); setNewTag(''); }}>Add</Button>
                      </Group>
                      <Group mt="sm" gap="xs">
                        {tags.map(t => (
                          <Button key={t} size="xs" variant="light" onClick={() => setTags(prev => prev.filter(x => x !== t))}>{t}</Button>
                        ))}
                      </Group>
                    </Grid.Col>
                  </Grid>
            </Paper>
            )}

            {openSection === 'announcements' && (
            <Paper withBorder p="md" id="announcements">
              <Title order={3} mb="sm">Announcements</Title>
              <Grid>
                <Grid.Col span={6}>
                  <TextInput label="Title" placeholder="Midterm contest announced" value={announcementTitle} onChange={(e) => setAnnouncementTitle(e.target.value)} />
                </Grid.Col>
                <Grid.Col span={12}>
                  <TextInput label="Body" placeholder="Details..." value={announcementBody} onChange={(e) => setAnnouncementBody(e.target.value)} />
                </Grid.Col>
                <Grid.Col span={12}>
                  <Group>
                    <Button variant="filled">Save</Button>
                    <Button variant="outline">Discard</Button>
                  </Group>
                </Grid.Col>
              </Grid>
            </Paper>
            )}

            {openSection === 'featured' && (
            <Paper withBorder p="md" id="featured">
              <Title order={3} mb="sm">Featured Content</Title>
              <Text size="sm" c="dimmed">Select problems/courses to feature (placeholder).</Text>
              <Group mt="sm">
                <Button variant="light">Add featured problem</Button>
                <Button variant="light">Add featured course</Button>
              </Group>
            </Paper>
            )}

            {openSection === 'courses' && (
            <Paper withBorder p="md" id="courses">
              <Title order={3} mb="sm">Courses</Title>
              <Group>
                <Checkbox checked={allowCourseCreation} onChange={(e) => setAllowCourseCreation(e.currentTarget.checked)} label="Allow course creation in UI" />
              </Group>
            </Paper>
            )}

            {openSection === 'bulk-accounts' && (
            <Paper withBorder p="md" id="bulk-accounts">
              <Title order={3} mb="sm">Bulk Accounts (CSV)</Title>
              <Stack gap="sm">
                <Text size="sm">Required columns: <Text span fw={600}>email</Text>, <Text span fw={600}>student_id</Text>. Optional: name, username, password.</Text>
                <FileInput label="Upload CSV" accept=".csv" value={csvFile} onChange={handleCsvUpload} clearable />
                {!!csvData.headers.length && (
                  <Grid>
                    <Grid.Col span={4}>
                      <Select label="Email column" data={csvData.headers} value={mapping.email} onChange={(v) => setMapping(prev => ({ ...prev, email: v }))} />
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <Select label="Student ID column" data={csvData.headers} value={mapping.studentId} onChange={(v) => setMapping(prev => ({ ...prev, studentId: v }))} />
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <Select label="Name column (optional)" data={['', ...csvData.headers]} value={mapping.name} onChange={(v) => setMapping(prev => ({ ...prev, name: v }))} />
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <Select label="Username column (optional)" data={['', ...csvData.headers]} value={mapping.username} onChange={(v) => setMapping(prev => ({ ...prev, username: v }))} />
                    </Grid.Col>
                    <Grid.Col span={4}>
                      <Select label="Password column (optional)" data={['', ...csvData.headers]} value={mapping.password} onChange={(v) => setMapping(prev => ({ ...prev, password: v }))} />
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <Select label="Contest" placeholder="Select contest" data={[{ value: 'contest-1', label: 'Contest 1' }, { value: 'contest-2', label: 'Contest 2' }]} value={selectedContest} onChange={setSelectedContest} />
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <Checkbox label="Force reset password for existing users" checked={forceResetPasswords} onChange={(e) => setForceResetPasswords(e.currentTarget.checked)} />
                    </Grid.Col>
                  </Grid>
                )}

                {!!csvData.headers.length && (
                  <Paper withBorder>
                    <ScrollArea h={220}>
                      <Table stickyHeader>
                        <Table.Thead>
                          <Table.Tr>
                            {csvData.headers.map(h => (<Table.Th key={h}>{h}</Table.Th>))}
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {previewRows.map((row, i) => (
                            <Table.Tr key={i}>
                              {csvData.headers.map(h => (<Table.Td key={h}>{row[h]}</Table.Td>))}
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </ScrollArea>
                  </Paper>
                )}

                <Group>
                  <Button loading={submitting} disabled={!csvHasRequired || !csvData.rows.length} onClick={handleGenerateAccounts}>Generate accounts</Button>
                  <Button variant="outline" disabled={!results.length} onClick={downloadCredentialsCsv}>Download credentials CSV</Button>
                </Group>

                {!!results.length && (
                  <Paper withBorder>
                    <ScrollArea h={220}>
                      <Table stickyHeader>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th>Email</Table.Th>
                            <Table.Th>Student ID</Table.Th>
                            <Table.Th>Username</Table.Th>
                            <Table.Th>Password</Table.Th>
                            <Table.Th>Contest</Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {results.map((r, i) => (
                            <Table.Tr key={i}>
                              <Table.Td>{r.email}</Table.Td>
                              <Table.Td>{r.studentId}</Table.Td>
                              <Table.Td>{r.username}</Table.Td>
                              <Table.Td>{r.password}</Table.Td>
                              <Table.Td>{r.contest || '-'}</Table.Td>
                            </Table.Tr>
                          ))}
                        </Table.Tbody>
                      </Table>
                    </ScrollArea>
                  </Paper>
                )}

                <Text size="xs" c="dimmed">Passwords are sensitive. Prefer distributing via secure channels. This UI does not email credentials.</Text>
              </Stack>
            </Paper>
            )}
          </Stack>
        </Grid.Col>
      </Grid>
    </Container>
  );
}


