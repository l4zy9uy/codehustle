import React from 'react';
import { Stack, Text, SimpleGrid } from '@mantine/core';
import CopyPre from '../CopyPre';
import { CODE_BOX_STYLE } from '../../constants/problems';

function ProblemSamples({ samples = [] }) {
  if (!samples.length) return <Text c="dimmed">No samples provided.</Text>;

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
                <CopyPre text={input} style={CODE_BOX_STYLE} />
              </Stack>

              {/* OUTPUT BLOCK */}
              <Stack gap={6}>
                <Text c="dimmed" fw={600}>Output</Text>
                <CopyPre text={output} style={CODE_BOX_STYLE} />
              </Stack>
            </SimpleGrid>
          </Stack>
        );
      })}
    </Stack>
  );
}

export default ProblemSamples;
