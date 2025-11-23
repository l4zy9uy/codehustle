import React, { useMemo } from 'react';
import { Stack, Select, Text, Group, Button } from '@mantine/core';
import { IconSend } from '@tabler/icons-react';
import CodeMirror from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { python } from '@codemirror/lang-python';
import { LANG_LABEL_VALUE } from '../../constants/problems';

export default function CodeEditor({ 
  lang, 
  setLang, 
  source, 
  setSource, 
  onSubmit, 
  submitting, 
  disabled,
  loading 
}) {
  // CodeMirror language extensions based on selected lang (only language modes)
  const extensions = useMemo(() => {
    switch (lang) {
      case 'cpp17':
        return [cpp()];
      case 'java17':
        return [java()];
      case 'py310':
        return [python()];
      default:
        return [];
    }
  }, [lang]);

  if (loading) {
    return (
      <>
        <div style={{ height: 34, width: 200, background: 'var(--mantine-color-gray-1)', borderRadius: 8 }} />
        <div style={{ height: 320, background: 'var(--mantine-color-gray-1)', borderRadius: 8 }} />
      </>
    );
  }

  return (
    <Stack gap="md">
      <Select
        data={[
          { value: LANG_LABEL_VALUE, label: "Language", disabled: true },
          { value: "cpp17", label: "C++17" },
          { value: "java17", label: "Java 17" },
          { value: "py310", label: "Python 3.10" },
        ]}
        value={lang ?? LANG_LABEL_VALUE}
        onChange={(v) => { if (v && v !== LANG_LABEL_VALUE) setLang(v); }}
        allowDeselect={false}
        size="xs"
        radius={8}
        style={{ width: 120 }}
      />
      <CodeMirror
        basicSetup={lang === 'py310' ? { autocompletion: false } : true}
        value={source}
        height="400px"
        extensions={extensions}
        onChange={(value) => setSource(value)}
        placeholder={
          !lang
            ? "// choose a language from the dropdown to enable syntax highlighting"
            : lang === "cpp17"
              ? "// paste or write your C++17 solution here"
              : lang === "java17"
                ? "// paste or write your Java 17 solution here"
                : "# paste or write your Python 3.10 solution here"
        }
      />
      <Group justify="space-between" wrap="wrap">
        <Text size="xs" c="dimmed">Press Ctrl+Enter (⌘+Enter on Mac) to submit</Text>
        <Button 
          leftSection={<IconSend size={16} />} 
          onClick={onSubmit}
          loading={submitting}
          disabled={disabled}
        >
          Submit
        </Button>
      </Group>
    </Stack>
  );
}
