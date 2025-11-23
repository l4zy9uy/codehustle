import React, { useState } from 'react';
import {
  Title,
  Text,
  Button,
  Group,
  Stack,
  Divider,
  Tabs,
} from '@mantine/core';
import { IconDeviceFloppy, IconFileText } from '@tabler/icons-react';
import { useAuth } from '../../../context/AuthContext';
import { useProblemEditor } from '../../../hooks/useProblemEditor';
import BasicInfoTab from '../../../components/admin/problems/BasicInfoTab';
import DescriptionTab from '../../../components/admin/problems/DescriptionTab';
import TestCasesTab from '../../../components/admin/problems/TestCasesTab';

export default function ProblemEditor() {
  const { user, loading: authLoading } = useAuth();
  const canEdit = user?.roles?.includes('admin') || user?.roles?.includes('editor');
  const [activeTab, setActiveTab] = useState('basic');

  const {
    problemData,
    setProblemData,
    loading,
    testCases,
    handleSave,
    updateDescription,
    addTestCase,
    deleteTestCase,
    updateTestCaseFile,
  } = useProblemEditor();

  return (
    <>
      {authLoading && (
        <Text size="sm" c="dimmed">Loading...</Text>
      )}
      {!authLoading && !canEdit && (
        <Text c="red">You don't have permission to edit problems.</Text>
      )}
      {!authLoading && canEdit && (
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <Title order={1}>Create Problem</Title>
            <Button leftSection={<IconDeviceFloppy size={18} />} onClick={handleSave} loading={loading}>
              Save Problem
            </Button>
          </Group>
          <Divider />

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

            <Tabs.Panel value="basic" pt="md">
              <BasicInfoTab 
                problemData={problemData} 
                setProblemData={setProblemData} 
              />
            </Tabs.Panel>

            <Tabs.Panel value="description" pt="md">
              <DescriptionTab 
                description={problemData.description}
                updateDescription={updateDescription}
              />
            </Tabs.Panel>

            <Tabs.Panel value="tests" pt="md">
              <TestCasesTab 
                testCases={testCases}
                addTestCase={addTestCase}
                deleteTestCase={deleteTestCase}
                updateTestCaseFile={updateTestCaseFile}
              />
            </Tabs.Panel>
          </Tabs>
        </Stack>
      )}
    </>
  );
}
