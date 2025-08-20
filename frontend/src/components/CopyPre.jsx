import React from "react";
import {Box, ActionIcon, Tooltip, SimpleGrid, Grid, CopyButton} from "@mantine/core";
import {useClipboard} from "@mantine/hooks";
import {IconCopy, IconCheck} from "@tabler/icons-react";

/**
 * CopyPre — renders a <pre> block with a copy button overlay
 * Props:
 *  - text: string to display and copy
 *  - style: CSS style object to apply to the <pre>
 */
export default function CopyPre({text, style}) {
    return (
        <Grid style={style} cols={2}>
            <Grid.Col span={10.6}>
                {text || '(empty)'}
            </Grid.Col>
            <Grid.Col span={1.4}>
                <CopyButton value={text || ''} timeout={1500}>
                    {({copied, copy}) => (
                        <ActionIcon
                            color={copied ? 'teal' : 'gray'}
                            onClick={copy}
                            size="xs"
                            sx={{position: 'absolute', top: 8, right: 8}}
                        >
                            {copied ? <IconCheck size={14}/> : <IconCopy size={14}/>}
                        </ActionIcon>
                    )}
                </CopyButton>
            </Grid.Col>
        </Grid>
    );
}
