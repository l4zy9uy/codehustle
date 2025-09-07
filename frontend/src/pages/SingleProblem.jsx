import React, { useMemo, useState, useEffect } from "react";
import { useParams } from 'react-router-dom';
import { getProblem } from '../lib/api/problems';
import {
    Anchor,
    Badge,
    Box,
    Breadcrumbs,
    Button,
    Card,
    Divider,
    Group,
    List,
    Paper,
    ScrollArea,
    Select,
    SimpleGrid,
    Stack,
    Text,
    ThemeIcon,
    Title,
    Tooltip,
} from "@mantine/core";
import { useViewportSize } from "@mantine/hooks";
import {
    IconCpu,
    IconInfoCircle,
    IconSend,
    IconTag,
    IconChecks,
    IconClock,
} from "@tabler/icons-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import CopyPre from "../components/CopyPre";
import CodeMirror from '@uiw/react-codemirror';
import { cpp } from '@codemirror/lang-cpp';
import { java } from '@codemirror/lang-java';
import { python } from '@codemirror/lang-python';
// removed custom basicSetup import; using wrapper basicSetup prop instead

/**
 * ProblemPage.jsx — Desktop-first problem detail page for CodeHustle OJ
 * Product rules (as agreed):
 *  - No time limit shown anywhere
 *  - Only Submit (NO run-on-sample)int main() {
  s
  if () {

  }
}
 *  - No Notes / No Editorial sections
 *  - Samples are rendered INLINE (no file downloads)
 *  - Tags = categories
 *  - Difficulty pill colors: easy=green, medium=yellow, hard=red
 *  - "Solved" badge next to title if solved
 *  - All problem metadata (title, difficulty, solved, id, memory, tags, optional acceptance) lives in LEFT column
 */

const DIFF_COLOR = {
    easy: "green",
    medium: "yellow",
    hard: "red",
};

function DifficultyBadge({ level }) {
    const key = (level || "").toLowerCase();
    const color = DIFF_COLOR[key] || "gray";
    const label = key ? key[0].toUpperCase() + key.slice(1) : "Unknown";
    const textColorVar = `var(--mantine-color-${color}-6)`;
    return (
        <Badge size="md" variant="light" color="gray" radius="xl" style={{ color: textColorVar }}>
            {label}
        </Badge>
    );
}

function MetaRow({ icon, label, value, tooltip }) {
    if (value === undefined || value === null || value === "") return null;
    return (
        <Tooltip label={tooltip} openDelay={300}>
            <Group gap={6} wrap="nowrap">
                <ThemeIcon size={22} radius="md" variant="light">
                    {icon}
                </ThemeIcon>
                <Text size="sm" c="dimmed">{label}:</Text>
                <Text size="sm" fw={600}>{value}</Text>
            </Group>
        </Tooltip>
    );
}

function TagList({ tags = [] }) {
    if (!tags.length) return null;
    return (
        <Group gap={8} wrap="wrap">
            {tags.map((t) => (
                <Badge key={t} variant="light" radius="xl" leftSection={<IconTag size={14} />}>{t}</Badge>
            ))}
        </Group>
    );
}

function SampleInline({ samples = [] }) {
    if (!samples.length) return <Text c="dimmed">No samples provided.</Text>;

    const codeBoxStyle = {
        fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
        fontSize: 14,
        lineHeight: 1.5,
        whiteSpace: "pre-wrap",
        overflowX: "hidden",
        overflowY: "auto",
        maxHeight: 320,
        padding: 12,
        border: "1px solid var(--mantine-color-gray-3)",
        borderRadius: 8,
        background: "var(--mantine-color-gray-0)",
    };


    return (
        <Stack gap="lg">
            {samples.map((s, idx) => {
                const input = s.input_text ?? s.input ?? "";
                const output = s.output_text ?? s.output ?? "";
                return (
                    <Stack key={idx} gap="xs">
                        <Text fw={600}>{`Sample ${idx + 1}`}</Text>

                        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
                            {/* INPUT BLOCK */}
                            <Stack gap={6}>
                                <Text c="dimmed" fw={600}>Input</Text>
                                <CopyPre text={input} style={codeBoxStyle} />
                            </Stack>

                            {/* OUTPUT BLOCK */}
                            <Stack gap={6}>
                                <Text c="dimmed" fw={600}>Output</Text>
                                <CopyPre text={output} style={codeBoxStyle} />
                            </Stack>
                        </SimpleGrid>

                    </Stack>
                );
            })}
        </Stack>
    );
}

function Section({ id, title, children, hideTitle = false }) {
    return (
        <Stack id={id} gap={6}>
            {!hideTitle && (
                <>
                    <Title order={3}>{title}</Title>
                    <Divider my={2} />
                </>
            )}
            <Box>{children}</Box>
        </Stack>
    );
}

export default function ProblemPage({ problem: incomingProblem, onSubmit, defaultLang }) {
    const params = useParams();
    // Fallback demo data for local preview
    const [fetchedProblem, setFetchedProblem] = useState(null);

    useEffect(() => {
        const slug = params?.slug;
        if (!incomingProblem && slug) {
            getProblem(slug).then(setFetchedProblem).catch(() => setFetchedProblem(null));
        }
    }, [incomingProblem, params?.slug]);

    const problem = useMemo(
        () => incomingProblem || fetchedProblem || {},
        [incomingProblem, fetchedProblem]
    );
    // State for selected language and source code
    const [lang, setLang] = useState(defaultLang || "cpp17");
    const [source, setSource] = useState("");
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

    const { width } = useViewportSize();
    const isDesktop = width >= 1024;

    const memLimit =
        problem.memory_limit_mb !== undefined && problem.memory_limit_mb !== null
            ? `${problem.memory_limit_mb} MB`
            : undefined;
    const accRate =
        problem.acceptance_rate !== undefined && problem.acceptance_rate !== null
            ? `${Number(problem.acceptance_rate).toFixed(1)}%`
            : undefined;
    const timeLimit =
        problem.time_limit !== undefined && problem.time_limit !== null
            ? `${problem.time_limit} s`
            : undefined;

    // Keyboard shortcut: Ctrl+Enter to submit
    useEffect(() => {
        function onKey(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                handleSubmit();
            }
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lang, source, problem]);

    function handleSubmit() {
        if (typeof onSubmit === "function") onSubmit({ lang, source, problem });
    }

    return (
        <Box p="md">
            {/* BREADCRUMBS */}
            <Breadcrumbs mb="sm">
                <Anchor href="/problems">Problems</Anchor>
                {problem.tags?.[0] && (
                    <Anchor href={`/problems?tag=${problem.tags[0]}`}>{problem.tags[0]}</Anchor>
                )}
                <Text c="dimmed">{problem.slug}</Text>
            </Breadcrumbs>

            <SimpleGrid cols={{ base: 1, md: 2 }} spacing='xs'>
                {/* LEFT: TITLE + META + STATEMENT (all metadata lives here) */}
                <Paper withBorder p="lg" radius="md" className="problem-content">
                    <ScrollArea.Autosize mah={isDesktop ? 720 : 520} offsetScrollbars>
                        <Stack gap="lg">
                            {/* Title visible per spec */}
                            <Group align="center" gap="sm" wrap="wrap">
                                <Title order={1} style={{ lineHeight: 1.15 }}>{problem.title}</Title>
                            </Group>
                            {/* Difficulty and Solved badges on same line */}
                            <Group align="center" gap="sm" wrap="nowrap" mt="xs">
                                <DifficultyBadge level={problem.difficulty} />
                                {problem.solved_by_me && (
                                    <Badge leftSection={<IconChecks size={14} />} color="teal" variant="light" size="md" radius="xl">
                                        Solved
                                    </Badge>
                                )}
                            </Group>

                            {/* COMPACT META BLOCK */}
                            <Stack gap={8}>
                                <Group gap="lg" wrap="wrap">
                                    <MetaRow
                                        icon={<IconClock size={16} />}
                                        label="Time limit"
                                        value={timeLimit}
                                        tooltip="Maximum time (seconds) allowed during grading"
                                    />
                                    <MetaRow
                                        icon={<IconCpu size={16} />}
                                        label="Memory limit"
                                        value={memLimit}
                                        tooltip="Maximum resident memory (RSS) allowed during grading"
                                    />
                                    <MetaRow
                                        icon={<IconInfoCircle size={16} />}
                                        label="Acceptance"
                                        value={accRate}
                                        tooltip="Acceptance rate"
                                    />
                                </Group>
                                <TagList tags={problem.tags} />
                            </Stack>

                            {/* STATEMENT SECTIONS */}
                            <Section id="overview" title="Description" hideTitle>
                                <Box style={{ fontFamily: 'Inter, sans-serif' }}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {problem.statement?.overview || ''}
                                    </ReactMarkdown>
                                </Box>
                            </Section>

                            <Section id="input" title="Input">
                                <Box style={{ fontFamily: 'Inter, sans-serif' }}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {problem.statement?.input || ''}
                                    </ReactMarkdown>
                                </Box>
                            </Section>

                            <Section id="output" title="Output">
                                <Box style={{ fontFamily: 'Inter, sans-serif' }}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                        {problem.statement?.output || ''}
                                    </ReactMarkdown>
                                </Box>
                            </Section>

                            <Section id="constraints" title="Constraints">
                                <List spacing="xs" withPadding>
                                    {Array.isArray(problem.statement?.constraints)
                                        ? problem.statement.constraints.map((c, i) => (
                                            <List.Item key={i}>
                                                <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                    {c}
                                                </ReactMarkdown>
                                            </List.Item>
                                        ))
                                        : String(problem.statement?.constraints)
                                            .split(";")
                                            .filter(Boolean)
                                            .map((c, i) => (
                                                <List.Item key={i}>
                                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
                                                        {c.trim()}
                                                    </ReactMarkdown>
                                                </List.Item>
                                            ))}
                                </List>
                            </Section>

                            <Section id="samples" title="Samples">
                                <SampleInline samples={problem.samples} />
                            </Section>
                        </Stack>
                    </ScrollArea.Autosize>
                </Paper>

                {/* RIGHT: SUBMIT PANEL (sticky) */}
                <Box style={{ position: "relative" }}>
                    <Card withBorder padding="lg" radius="md" style={{ position: "sticky", top: 16 }}>
                        <Stack gap="md">
                            <Select
                                label="Language"
                                data={[
                                    { value: "cpp17", label: "C++17" },
                                    { value: "java17", label: "Java 17" },
                                    { value: "py310", label: "Python 3.10" },
                                ]}
                                value={lang}
                                onChange={setLang}
                                allowDeselect={false}
                            />
                                <CodeMirror
                                    basicSetup={lang === 'py310' ? { autocompletion: false } : true}
                                    value={source}
                                    height="400px"
                                    extensions={extensions}
                                    onChange={(value) => setSource(value)}
                                    placeholder={
                                        lang === "cpp17"
                                            ? "// paste or write your C++17 solution here"
                                            : lang === "java17"
                                                ? "// paste or write your Java 17 solution here"
                                                : "# paste or write your Python 3.10 solution here"
                                    }
                                />
                                <Group justify="space-between" wrap="wrap">
                                    <Button leftSection={<IconSend size={16} />} onClick={handleSubmit}>
                                        Submit
                                    </Button>
                                </Group>
                        </Stack>
                    </Card>
                </Box>
            </SimpleGrid>

            {/* FOOTER HINTS */}
            <Group justify="space-between" mt="lg" c="dimmed">
                <Text size="sm">© CodeHustle</Text>
            </Group>
        </Box>
    );
}
