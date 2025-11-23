import React from 'react';
import { Stack, Group, Title, Button, Paper, Grid, FileInput, Text, ActionIcon } from '@mantine/core';
import { IconPlus, IconTrash, IconUpload } from '@tabler/icons-react';

export default function TestCasesTab({ 
  testCases, 
  addTestCase, 
  deleteTestCase, 
  updateTestCaseFile 
}) {
  return (
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
  );
}

