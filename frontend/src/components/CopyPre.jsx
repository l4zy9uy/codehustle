import React from "react";
import { ActionIcon, Grid, CopyButton } from "@mantine/core";
import { IconCopy, IconCheck } from "@tabler/icons-react";

/**
 * CopyPre — renders a <pre> block with an optional copy button overlay
 * Props:
 *  - text: string to display and copy
 *  - style: CSS style object to apply to the container
 *  - showCopy: whether to show the copy button overlay (default: true)
 */
export default function CopyPre({ text, style, showCopy = true }) {
    return (
        <Grid style={style} cols={showCopy ? 2 : 1}>
            <Grid.Col span={showCopy ? 11 : 12}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{text || '(empty)'}</pre>
            </Grid.Col>
            {showCopy && (
                <Grid.Col span={1} style={{ position: 'relative' }}>
                    <CopyButton value={text || ''} timeout={1500}>
                        {({ copied, copy }) => (
                            <ActionIcon
                                color={copied ? 'teal' : 'gray'}
                                onClick={copy}
                                size="xs"
                                style={{ position: 'absolute', top: 8, right: 8 }}
                            >
                                {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                            </ActionIcon>
                        )}
                    </CopyButton>
                </Grid.Col>
            )}
        </Grid>
    );
}
