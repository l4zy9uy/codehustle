import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  Text,
  Button,
  Group,
  Stack,
  TextInput,
  Select,
  NumberInput,
  Textarea,
  Divider,
  Grid,
  Badge,
  ActionIcon,
  Tabs,
  Table,
  ScrollArea,
  FileInput,
  Checkbox,
  Anchor,
} from '@mantine/core';
import { 
  IconArrowLeft, 
  IconDeviceFloppy, 
  IconEye, 
  IconFileText,
  IconCode,
  IconUpload,
  IconDownload,
  IconEdit,
  IconTrash,
  IconPlus,
  IconCheck
} from '@tabler/icons-react';
import { useAuth } from '../../../context/AuthContext';

export default function ProblemEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const isEdit = id !== 'new';
  
  // Check permissions
  const canEdit = user?.role === 'admin' || user?.role === 'editor';

  const [problemData, setProblemData] = useState({
    title: '',
    difficulty: 'medium',
    timeLimit: 1000,
    memoryLimit: 256,
    encoding: 'UTF-8',
    description: {
      legend: '',
      inputFormat: '',
      outputFormat: '',
      notes: '',
    },
    tags: [],
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Mock file data
  const [sourceFiles, setSourceFiles] = useState([
    { id: 1, name: 'v.cpp', type: 'validator', language: 'cpp.g++17', length: 255, modified: '2025-09-19 08:45:43' },
    { id: 2, name: 'echo.cpp', type: 'generator', language: 'cpp.g++17', length: 206, modified: '2025-09-19 08:45:43' },
  ]);

  const [solutionFiles, setSolutionFiles] = useState([
    { id: 1, name: 'solution.cpp', author: 'admin', language: 'cpp.g++17', length: 437, modified: '2025-08-23 21:13:18', type: 'Main correct solution' },
  ]);

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true);
      setTimeout(() => {
        setProblemData({
          title: 'A+B Problem',
          difficulty: 'easy',
          timeLimit: 1000,
          memoryLimit: 256,
          encoding: 'UTF-8',
          description: {
            legend: 'You are given two integers $a$ and $b$. Print $a+b$.',
            inputFormat: 'The only line of the input contains integers $a$ and $b$ ($-100 \\le a,b \\le 100$).',
            outputFormat: 'Print $a+b$.',
            notes: 'In the first example, $a=7$ and $b=8$. Thus, the answer is $a+b=7+8=15$.',
          },
          tags: ['math', 'implementation'],
        });
        setLoading(false);
      }, 1000);
    }
  }, [id, isEdit]);

  const handleSave = async () => {
    setLoading(true);
    try {
      console.log('Saving problem:', problemData);
      await new Promise(resolve => setTimeout(resolve, 1000));
      navigate('/problems');
    } catch (error) {
      console.error('Error saving problem:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = () => {
    console.log('Preview problem:', problemData);
  };

  const updateDescription = (field, value) => {
    setProblemData(prev => ({
      ...prev,
      description: {
        ...prev.description,
        [field]: value
      }
    }));
  };

  return (
    <Container size="xl" py="md">
      {/* Auth loading guard and permission message without breaking hooks order */}
      {authLoading && (
        <Text size="sm" c="dimmed">Loading...</Text>
      )}
      {!authLoading && !canEdit && (
        <Container size="md" py="xl">
          <Text c="red">You don't have permission to edit problems.</Text>
        </Container>
      )}
      {!authLoading && canEdit && (
      <Stack gap="md">
        {/* Header removed per request */}
        <Divider />

        {/* Tabbed Interface */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="basic" leftSection={<IconFileText size={16} />}>
              Basic Info
            </Tabs.Tab>
            <Tabs.Tab value="description" leftSection={<IconFileText size={16} />}>
              Description
            </Tabs.Tab>
            <Tabs.Tab value="sources" leftSection={<IconCode size={16} />}>
              Source Files
            </Tabs.Tab>
            <Tabs.Tab value="solutions" leftSection={<IconCheck size={16} />}>
              Solutions
            </Tabs.Tab>
            <Tabs.Tab value="tests" leftSection={<IconFileText size={16} />}>
              Test Cases
            </Tabs.Tab>
          </Tabs.List>

          {/* Basic Information Tab */}
          <Tabs.Panel value="basic" pt="md">
            <Grid>
              <Grid.Col span={8}>
                <Stack gap="md">
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
                          />
                        </Grid.Col>
                        <Grid.Col span={3}>
                          <NumberInput
                            label="Time limit (ms)"
                            value={problemData.timeLimit}
                            onChange={(value) => setProblemData(prev => ({ ...prev, timeLimit: Number(value) || 0 }))}
                            min={0}
                          />
                        </Grid.Col>
                        <Grid.Col span={3}>
                          <NumberInput
                            label="Memory limit (MB)"
                            value={problemData.memoryLimit}
                            onChange={(value) => setProblemData(prev => ({ ...prev, memoryLimit: Number(value) || 0 }))}
                            min={0}
                          />
                        </Grid.Col>
                      </Grid>
                    </Stack>
                  </Paper>
                </Stack>
              </Grid.Col>

              <Grid.Col span={4}>
                <Stack gap="md">
                  <Paper withBorder p="md">
                    <Title order={4} mb="md">Problem Info</Title>
                    <Stack gap="sm">
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Status</Text>
                        <Badge color="blue">Draft</Badge>
                      </Group>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Author</Text>
                        <Text size="sm">{user?.name || 'Unknown'}</Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Created</Text>
                        <Text size="sm">{isEdit ? '2 days ago' : 'Now'}</Text>
                      </Group>
                      <Group justify="space-between">
                        <Text size="sm" c="dimmed">Last Modified</Text>
                        <Text size="sm">{isEdit ? '1 hour ago' : 'Now'}</Text>
                      </Group>
                    </Stack>
                  </Paper>

                  <Paper withBorder p="md">
                    <Title order={4} mb="md">Tags</Title>
                    <Stack gap="xs">
                      <Group gap="xs">
                        {problemData.tags.map((tag, index) => (
                          <Badge key={index} variant="light" color="gray">
                            {tag}
                          </Badge>
                        ))}
                      </Group>
                      <Group gap="xs">
                        <TextInput
                          placeholder="New tag"
                          value={tagInput ?? ''}
                          onChange={(e) => setTagInput(e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <Button size="xs" leftSection={<IconPlus size={14} />} onClick={() => {
                          const next = (tagInput ?? '').trim();
                          if (!next) return;
                          setProblemData(prev => ({ ...prev, tags: [...prev.tags, next] }));
                          setTagInput('');
                        }}>Add</Button>
                      </Group>
                    </Stack>
                  </Paper>
                </Stack>
              </Grid.Col>
            </Grid>
          </Tabs.Panel>

          {/* Description Tab */}
          <Tabs.Panel value="description" pt="md">
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                See our brief manual to learn about supported TeX commands.
              </Text>
              
              <Paper withBorder p="md">
                <Group justify="space-between" mb="md">
                  <Title order={4}>Legend</Title>
                  <Button variant="outline" size="xs">Drafts</Button>
                </Group>
                <Textarea
                  placeholder="You are given two integers $a$ and $b$. Print $a+b$."
                  value={problemData.description.legend}
                  onChange={(e) => updateDescription('legend', e.target.value)}
                  minRows={6}
                  autosize
                />
              </Paper>

              <Paper withBorder p="md">
                <Group justify="space-between" mb="md">
                  <Title order={4}>Input format</Title>
                  <Button variant="outline" size="xs">Drafts</Button>
                </Group>
                <Textarea
                  placeholder="The only line of the input contains integers $a$ and $b$ ($-100 \\le a,b \\le 100$)."
                  value={problemData.description.inputFormat}
                  onChange={(e) => updateDescription('inputFormat', e.target.value)}
                  minRows={4}
                  autosize
                />
              </Paper>

              <Paper withBorder p="md">
                <Group justify="space-between" mb="md">
                  <Title order={4}>Output format</Title>
                  <Button variant="outline" size="xs">Drafts</Button>
                </Group>
                <Textarea
                  placeholder="Print $a+b$."
                  value={problemData.description.outputFormat}
                  onChange={(e) => updateDescription('outputFormat', e.target.value)}
                  minRows={4}
                  autosize
                />
              </Paper>

              <Paper withBorder p="md">
                <Group justify="space-between" mb="md">
                  <Title order={4}>Notes</Title>
                  <Button variant="outline" size="xs">Drafts</Button>
                </Group>
                <Textarea
                  placeholder="In the first example, $a=7$ and $b=8$. Thus, the answer is $a+b=7+8=15$."
                  value={problemData.description.notes}
                  onChange={(e) => updateDescription('notes', e.target.value)}
                  minRows={4}
                  autosize
                />
              </Paper>
            </Stack>
          </Tabs.Panel>

          {/* Source Files Tab */}
          <Tabs.Panel value="sources" pt="md">
            <Stack gap="md">
              <Group justify="space-between">
                <Title order={3}>Source Files</Title>
                      
              </Group>

              <Paper withBorder>
                <ScrollArea>
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Language</Table.Th>
                        <Table.Th>Length</Table.Th>
                        <Table.Th>Modified</Table.Th>
                        <Table.Th>Actions</Table.Th>
                        <Table.Th></Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {sourceFiles.map((file) => (
                        <Table.Tr key={file.id}>
                          <Table.Td>
                            <Stack gap={2}>
                              <Text size="sm">{file.name} {file.type}</Text>
                              <Anchor size="xs">Rename?</Anchor>
                            </Stack>
                          </Table.Td>
                          <Table.Td>
                            <Select
                              data={[
                                { value: 'cpp.g++17', label: 'cpp.g++17' },
                                { value: 'python.3', label: 'python.3' },
                              ]}
                              value={file.language}
                              size="xs"
                            />
                          </Table.Td>
                          <Table.Td>{file.length}</Table.Td>
                          <Table.Td>{file.modified}</Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <Anchor size="xs">Delete</Anchor>
                              <Anchor size="xs">Download</Anchor>
                              <Anchor size="xs">Edit</Anchor>
                              <Anchor size="xs">View</Anchor>
                              <Anchor size="xs">Lang</Anchor>
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Checkbox />
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Paper>

              <Stack gap="sm">
                <Text size="sm">
                  Upload files for generators, validators and checkers (if you need). It is strongly recommended to use testlib in it.
                </Text>
                <Text size="sm">
                  Do not upload solutions here, use solutions tab instead.
                </Text>
                      
                <Text size="sm">
                  <Anchor>You can read more about generators here.</Anchor>
                </Text>
                <Button variant="outline" size="sm">
                  Check sources for compilability
                </Button>
              </Stack>
            </Stack>
          </Tabs.Panel>

          {/* Solutions Tab */}
          <Tabs.Panel value="solutions" pt="md">
            <Stack gap="md">
              <Group justify="space-between">
                <Title order={3}>Solution files</Title>
                      
              </Group>

              <Paper withBorder>
                <ScrollArea>
                  <Table>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Author</Table.Th>
                        <Table.Th>Name</Table.Th>
                        <Table.Th>Language</Table.Th>
                        <Table.Th>Length</Table.Th>
                        <Table.Th>Modified</Table.Th>
                        <Table.Th>Type</Table.Th>
                        <Table.Th>Actions</Table.Th>
                        <Table.Th></Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {solutionFiles.map((file) => (
                        <Table.Tr key={file.id}>
                          <Table.Td>{file.author}</Table.Td>
                          <Table.Td>
                            <Stack gap={2}>
                              <Text size="sm">{file.name}</Text>
                              <Group gap="xs">
                                <Anchor size="xs">Note</Anchor>
                                <Anchor size="xs">Rename</Anchor>
                              </Group>
                            </Stack>
                          </Table.Td>
                          <Table.Td>
                            <Select
                              data={[
                                { value: 'cpp.g++17', label: 'cpp.g++17' },
                                { value: 'python.3', label: 'python.3' },
                              ]}
                              value={file.language}
                              size="xs"
                            />
                          </Table.Td>
                          <Table.Td>{file.length}</Table.Td>
                          <Table.Td>{file.modified}</Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <Text size="sm">{file.type}</Text>
                              <Anchor size="xs">Change?</Anchor>
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Group gap="xs">
                              <Anchor size="xs">Delete</Anchor>
                              <Anchor size="xs">Download</Anchor>
                              <Anchor size="xs">Edit</Anchor>
                              <Anchor size="xs">View</Anchor>
                              <Anchor size="xs">Translate</Anchor>
                            </Group>
                          </Table.Td>
                          <Table.Td>
                            <Checkbox />
                          </Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </ScrollArea>
              </Paper>

              <Stack gap="sm">
                <Text size="sm">Upload solution files here.</Text>
                <Text size="sm">
                  There should be exactly one "Main correct solution" (also known as "model solution"). It will be used to generate jury answers.
                </Text>
                <Button variant="outline" size="sm">
                  Check solutions for compilability
                </Button>
              </Stack>
            </Stack>
          </Tabs.Panel>

          {/* Test Cases Tab */}
          <Tabs.Panel value="tests" pt="md">
            <Stack gap="md">
              <Title order={3}>Test Cases</Title>
              <Paper withBorder p="md">
                <Text c="dimmed">Test cases management will be implemented here.</Text>
              </Paper>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
      )}
    </Container>
  );
}
