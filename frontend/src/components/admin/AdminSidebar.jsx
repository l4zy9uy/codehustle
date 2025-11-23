import React from 'react';
import { Paper, Stack, Accordion, Button, Text } from '@mantine/core';
import { sectionLinks, sectionSubsections } from '../../constants/admin';

export default function AdminSidebar({ 
  openParentSection, 
  setOpenParentSection, 
  activeChildSection, 
  setActiveChildSection 
}) {
  return (
    <Paper withBorder radius="md" p="md" style={{ flex: 1, height: '100%' }}>
      <Stack gap="xs">
        <Accordion
          chevronPosition="right"
          multiple={false}
          value={openParentSection}
          onChange={(value) => setOpenParentSection(value)}
        >
          {sectionLinks.map((section) => (
            <Accordion.Item key={section.id} value={section.id}>
              <Accordion.Control
                styles={{
                  root: { justifyContent: 'flex-start', textAlign: 'left' },
                  label: { justifyContent: 'flex-start', textAlign: 'left', width: '100%' },
                }}
              >
                <Text fw={500} size="md" style={{ width: '100%', textAlign: 'left' }}>
                  {section.label}
                </Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="xs">
                  <Stack gap={4}>
                    {(sectionSubsections[section.id] || ['Details']).map((sub) => {
                      const childValue = `${section.id}::${sub}`;
                      const isActive = activeChildSection === childValue;
                      return (
                        <Button
                          key={sub}
                          variant={isActive ? 'light' : 'subtle'}
                          size="xs"
                          fullWidth
                          styles={{
                            root: {
                              borderRadius: 0,
                              justifyContent: 'flex-start',
                              paddingInline: 0,
                            },
                            inner: {
                              justifyContent: 'flex-start',
                              width: '100%',
                            },
                            label: {
                              fontSize: '0.95rem',
                              fontWeight: 100,
                              justifyContent: 'flex-start',
                            },
                          }}
                          onClick={() => {
                            setOpenParentSection(section.id);
                            setActiveChildSection(childValue);
                          }}
                        >
                          {sub}
                        </Button>
                      );
                    })}
                  </Stack>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      </Stack>
    </Paper>
  );
}

