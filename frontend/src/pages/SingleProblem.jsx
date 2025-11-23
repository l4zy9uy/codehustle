import React, { useState, useEffect } from "react";
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  SimpleGrid,
  Paper,
  ScrollArea,
  Stack,
  Text,
  Group,
} from "@mantine/core";
import { IconCode } from "@tabler/icons-react";
import { useProblemDetail } from '../hooks/useProblemDetail';
import { useProblemSubmission } from '../hooks/useProblemSubmission';
import ProblemHeader from '../components/problems/ProblemHeader';
import ProblemStatement from '../components/problems/ProblemStatement';
import ProblemSamples from '../components/problems/ProblemSamples';
import ProblemTags from '../components/problems/ProblemTags';
import CodeEditor from '../components/problems/CodeEditor';
import SubmissionList from '../components/problems/SubmissionList';
import { PANE_HEADER_H } from '../constants/problems';

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

function PaneHeaderBar({ children }) {
  return (
    <Box style={{ padding: 4, background: 'var(--mantine-color-gray-0)' }}>
      {children}
    </Box>
  );
}

function LeftTabsHeader({ leftTab, setLeftTab }) {
  const TabButton = ({ active, onClick, leftSection, children }) => (
    <button
      onClick={onClick}
      style={{
        fontWeight: active ? 600 : 200,
        height: PANE_HEADER_H,
        paddingInline: 8,
        fontSize: 'var(--mantine-font-size-sm)',
        lineHeight: 1,
        border: 0,
        borderRadius: 4,
        background: 'transparent',
        color: active ? 'var(--mantine-color-gray-9)' : 'var(--mantine-color-dimmed)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 4,
      }}
    >
      {leftSection}
      {children}
    </button>
  );

  return (
    <PaneHeader>
      <TabButton
        active={leftTab === 'problem'}
        onClick={() => setLeftTab('problem')}
        leftSection={<span style={{ fontSize: 16 }}>📄</span>}
      >
        Problem
      </TabButton>
      <div style={{ height: 18, width: 1, background: 'var(--mantine-color-default-border)', alignSelf: 'center' }} />
      <TabButton
        active={leftTab === 'submissions'}
        onClick={() => setLeftTab('submissions')}
        leftSection={<span style={{ fontSize: 16 }}>✓</span>}
      >
        Submissions
      </TabButton>
    </PaneHeader>
  );
}

export default function ProblemPage({ problem: incomingProblem, onSubmit, defaultLang }) {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const [leftTab, setLeftTab] = useState('problem');
  const [expandedSubmissionId, setExpandedSubmissionId] = useState(null);

  const { problem, loading, memLimit, accRate, timeLimit } = useProblemDetail(params?.slug, incomingProblem);
  const { submissions, submitting, lang, setLang, source, setSource, handleSubmit } = useProblemSubmission(problem.id, defaultLang);

  // Initialize expanded submission from URL (?sid=...)
  useEffect(() => {
    if (!searchParams || typeof searchParams.get !== 'function') return;
    const sid = searchParams.get('sid');
    if (sid) setExpandedSubmissionId(sid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keyboard shortcut: Ctrl+Enter to submit
  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit(onSubmit).then(() => {
          setLeftTab('submissions');
        }).catch(() => {});
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, source, problem]);

  const isLoading = !incomingProblem && loading;

  return (
    <Box
      maw={1800}
      mx="auto"
      style={{
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing='sm' style={{ flex: 1, minHeight: 0 }}>
        {/* LEFT: TITLE + META + STATEMENT */}
        <Paper withBorder p={0} radius="md" className="problem-content" style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <PaneHeaderBar>
            <LeftTabsHeader leftTab={leftTab} setLeftTab={setLeftTab} />
          </PaneHeaderBar>
          <ScrollArea
            style={{
              flex: 1,
              minHeight: 0,
              marginRight: 'calc(-1 * var(--mantine-spacing-lg) + 16)',
            }}
          >
            <Stack gap="lg" style={{ padding: 'var(--mantine-spacing-lg)', paddingRight: 'var(--mantine-spacing-lg)' }}>
              {isLoading ? (
                <>
                  <div style={{ height: 28, width: '60%', background: 'var(--mantine-color-gray-1)', borderRadius: 4 }} />
                  <Group gap="sm">
                    <div style={{ height: 22, width: 72, background: 'var(--mantine-color-gray-1)', borderRadius: 4 }} />
                    <div style={{ height: 22, width: 80, background: 'var(--mantine-color-gray-1)', borderRadius: 4 }} />
                  </Group>
                  <Group gap="lg">
                    <div style={{ height: 18, width: 120, background: 'var(--mantine-color-gray-1)', borderRadius: 4 }} />
                    <div style={{ height: 18, width: 120, background: 'var(--mantine-color-gray-1)', borderRadius: 4 }} />
                    <div style={{ height: 18, width: 120, background: 'var(--mantine-color-gray-1)', borderRadius: 4 }} />
                  </Group>
                  <div style={{ height: 12, width: '90%', background: 'var(--mantine-color-gray-1)', borderRadius: 4 }} />
                  <div style={{ height: 12, width: '85%', background: 'var(--mantine-color-gray-1)', borderRadius: 4 }} />
                  <div style={{ height: 12, width: '80%', background: 'var(--mantine-color-gray-1)', borderRadius: 4 }} />
                </>
              ) : leftTab === 'problem' ? (
                <>
                  <ProblemHeader 
                    problem={problem} 
                    timeLimit={timeLimit} 
                    memLimit={memLimit} 
                    accRate={accRate} 
                  />
                  <ProblemStatement problem={problem} />
                  {problem.samples && problem.samples.length > 0 && (
                    <div>
                      <h3 style={{ margin: '8px 0 6px', fontSize: '1.25rem', fontWeight: 600 }}>Samples</h3>
                      <ProblemSamples samples={problem.samples} />
                    </div>
                  )}
                  <ProblemTags problem={problem} />
                </>
              ) : (
                <SubmissionList items={submissions} />
              )}
            </Stack>
          </ScrollArea>
        </Paper>

        {/* RIGHT: SUBMIT PANEL */}
        <Box style={{ height: '100%', minHeight: 0 }}>
          <Paper withBorder p={0} radius="md" style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <PaneHeaderBar>
              <PaneHeader>
                <IconCode size={16} style={{ color: 'var(--mantine-color-dimmed)' }} />
                <Text fw={600} c="dimmed" size="sm" style={{ lineHeight: 1 }}>Editor</Text>
              </PaneHeader>
            </PaneHeaderBar>
            <ScrollArea
              style={{
                flex: 1,
                minHeight: 0,
                marginRight: 'calc(-1 * var(--mantine-spacing-lg) + 16)',
              }}
            >
              <Stack gap="md" style={{ padding: 'var(--mantine-spacing-lg)', paddingRight: 'var(--mantine-spacing-lg)' }}>
                <CodeEditor
                  lang={lang}
                  setLang={setLang}
                  source={source}
                  setSource={setSource}
                  onSubmit={() => handleSubmit(onSubmit).then(() => setLeftTab('submissions')).catch(() => {})}
                  submitting={submitting}
                  disabled={submitting || !lang || !source.trim() || !problem.id}
                  loading={isLoading}
                />
              </Stack>
            </ScrollArea>
          </Paper>
        </Box>
      </SimpleGrid>
    </Box>
  );
}
