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
  Tabs,
  FileInput,
  ActionIcon,
} from '@mantine/core';
import { 
  IconDeviceFloppy, 
  IconEye, 
  IconFileText,
  IconPlus,
  IconTrash,
  IconUpload,
} from '@tabler/icons-react';
import { useAuth } from '../../../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

// Configure KaTeX options for better math rendering
const katexOptions = {
  throwOnError: false,
  errorColor: '#cc0000',
  displayMode: false,
  fleqn: false,
  macros: {
    "\\RR": "\\mathbb{R}",
    "\\NN": "\\mathbb{N}",
    "\\ZZ": "\\mathbb{Z}",
    "\\QQ": "\\mathbb{Q}",
    "\\CC": "\\mathbb{C}",
  },
};

// Markdown components for styling
const mdComponents = {
  p: (props) => <Text style={{ marginBottom: '0.5rem' }} {...props} />,
  h1: (props) => <Title order={1} style={{ marginTop: '1rem', marginBottom: '0.5rem' }} {...props} />,
  h2: (props) => <Title order={2} style={{ marginTop: '1rem', marginBottom: '0.5rem' }} {...props} />,
  h3: (props) => <Title order={3} style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }} {...props} />,
  h4: (props) => <Title order={4} style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }} {...props} />,
};

export default function ProblemEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const isEdit = id !== 'new';
  
  // Check permissions
  const canEdit = user?.roles?.includes('admin') || user?.roles?.includes('editor');

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
  const [showPreview, setShowPreview] = useState(false);
  const [tagInput, setTagInput] = useState('');
  
  // Test cases state
  const [testCases, setTestCases] = useState([
    { id: 1, inputFile: null, outputFile: null }
  ]);

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

  const updateDescription = (field, value) => {
    setProblemData(prev => ({
      ...prev,
      description: {
        ...prev.description,
        [field]: value
      }
    }));
  };

  const addTestCase = () => {
    const newId = testCases.length > 0 ? Math.max(...testCases.map(tc => tc.id)) + 1 : 1;
    setTestCases(prev => [...prev, { id: newId, inputFile: null, outputFile: null }]);
  };

  const deleteTestCase = (id) => {
    setTestCases(prev => prev.filter(tc => tc.id !== id));
  };

  const updateTestCaseFile = (id, fileType, file) => {
    setTestCases(prev => prev.map(tc => 
      tc.id === id ? { ...tc, [fileType]: file } : tc
    ));
  };

  return (
    <>
      {/* Auth loading guard and permission message without breaking hooks order */}
      {authLoading && (
        <Text size="sm" c="dimmed">Loading...</Text>
      )}
      {!authLoading && !canEdit && (
        <Text c="red">You don't have permission to edit problems.</Text>
      )}
      {!authLoading && canEdit && (
      <Stack gap="md">
        {/* Page Header */}
        <Group justify="space-between" align="center">
          <Title order={1}>Create Problem</Title>
          <Button leftSection={<IconDeviceFloppy size={18} />} onClick={handleSave} loading={loading}>
            Save Problem
          </Button>
        </Group>
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
            <Tabs.Tab value="tests" leftSection={<IconFileText size={16} />}>
              Test Cases
            </Tabs.Tab>
          </Tabs.List>

          {/* Basic Information Tab */}
          <Tabs.Panel value="basic" pt="md">
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
          </Tabs.Panel>

          {/* Description Tab */}
          <Tabs.Panel value="description" pt="md">
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
                      value={problemData.description.legend}
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
                      value={problemData.description.inputFormat}
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
                      value={problemData.description.outputFormat}
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
                      value={problemData.description.notes}
                      onChange={(e) => updateDescription('notes', e.target.value)}
                      minRows={4}
                      autosize
                      radius="sm"
                    />
                  </Paper>
                </>
              ) : (
                <Paper withBorder p="md">
                  <Title order={4} mb="md">Preview</Title>
                  <Divider mb="lg" />
                  <Stack gap="lg">
                    {problemData.description.legend && (
                      <div>
                        <ReactMarkdown 
                          components={mdComponents} 
                          remarkPlugins={[remarkGfm, remarkMath]} 
                          rehypePlugins={[[rehypeKatex, katexOptions]]}
                        >
                          {problemData.description.legend}
                        </ReactMarkdown>
                      </div>
                    )}
                    
                    {problemData.description.inputFormat && (
                      <div>
                        <Text fw={600} mb="xs">Input Format</Text>
                        <ReactMarkdown 
                          components={mdComponents} 
                          remarkPlugins={[remarkGfm, remarkMath]} 
                          rehypePlugins={[[rehypeKatex, katexOptions]]}
                        >
                          {problemData.description.inputFormat}
                        </ReactMarkdown>
                      </div>
                    )}
                    
                    {problemData.description.outputFormat && (
                      <div>
                        <Text fw={600} mb="xs">Output Format</Text>
                        <ReactMarkdown 
                          components={mdComponents} 
                          remarkPlugins={[remarkGfm, remarkMath]} 
                          rehypePlugins={[[rehypeKatex, katexOptions]]}
                        >
                          {problemData.description.outputFormat}
                        </ReactMarkdown>
                      </div>
                    )}
                    
                    {problemData.description.notes && (
                      <div>
                        <Text fw={600} mb="xs">Notes</Text>
                        <ReactMarkdown 
                          components={mdComponents} 
                          remarkPlugins={[remarkGfm, remarkMath]} 
                          rehypePlugins={[[rehypeKatex, katexOptions]]}
                        >
                          {problemData.description.notes}
                        </ReactMarkdown>
                      </div>
                    )}
                  </Stack>
                </Paper>
              )}
            </Stack>
          </Tabs.Panel>

          {/* Test Cases Tab */}
          <Tabs.Panel value="tests" pt="md">
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Title order={3}>Test Cases</Title>
                <Button 
                  leftSection={<IconPlus size={16} />} 
                  onClick={addTestCase}
                  size="sm"
                  radius="sm"
                >
                  Add Test Case
                </Button>
              </Group>

              {testCases.length === 0 ? (
                <Paper withBorder p="md">
                  <Text c="dimmed" ta="center">No test cases added yet. Click "Add Test Case" to get started.</Text>
                </Paper>
              ) : (
                <Stack gap="sm">
                  {testCases.map((testCase, index) => (
                    <Paper key={testCase.id} withBorder p="md">
                      <Group justify="space-between" align="flex-start" mb="md">
                        <Title order={5}>Test Case #{index + 1}</Title>
                        <ActionIcon 
                          color="red" 
                          variant="subtle"
                          onClick={() => deleteTestCase(testCase.id)}
                          disabled={testCases.length === 1}
                        >
                          <IconTrash size={18} />
                        </ActionIcon>
                      </Group>
                      
                      <Grid>
                        <Grid.Col span={6}>
                          <FileInput
                            label="Input File (.in)"
                            placeholder="Upload input file"
                            accept=".in"
                            leftSection={<IconUpload size={16} />}
                            value={testCase.inputFile}
                            onChange={(file) => updateTestCaseFile(testCase.id, 'inputFile', file)}
                            radius="sm"
                          />
                          {testCase.inputFile && (
                            <Text size="xs" c="dimmed" mt={4}>
                              {testCase.inputFile.name} ({(testCase.inputFile.size / 1024).toFixed(2)} KB)
                            </Text>
                          )}
                        </Grid.Col>
                        <Grid.Col span={6}>
                          <FileInput
                            label="Output File (.out)"
                            placeholder="Upload output file"
                            accept=".out"
                            leftSection={<IconUpload size={16} />}
                            value={testCase.outputFile}
                            onChange={(file) => updateTestCaseFile(testCase.id, 'outputFile', file)}
                            radius="sm"
                          />
                          {testCase.outputFile && (
                            <Text size="xs" c="dimmed" mt={4}>
                              {testCase.outputFile.name} ({(testCase.outputFile.size / 1024).toFixed(2)} KB)
                            </Text>
                          )}
                        </Grid.Col>
                      </Grid>
                    </Paper>
                  ))}
                </Stack>
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
        </Stack>
      )}
    </>
  );
}
