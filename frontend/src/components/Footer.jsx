import { Text, Container, Group } from '@mantine/core';

export default function Footer() {
    return (
        <footer className="py-6 bg-hustBlack text-white">
            <Container size="xl">
                <Group position="apart">
                    <Text>© {new Date().getFullYear()} CodeHustle - HUST</Text>
                    <Group spacing="md">
                        <a href="https://hust.edu.vn" target="_blank" rel="noopener noreferrer">HUST</a>
                        <a href="#">Contact</a>
                        <a href="#">Privacy Policy</a>
                    </Group>
                </Group>
            </Container>
        </footer>
    );
}