// pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useForm } from '@mantine/form';
import {
    TextInput,
    PasswordInput,
    Checkbox,
    Button,
    Group,
    Anchor,
    Title,
    Stack,
    Text,
    Alert,
} from '@mantine/core';
import { IconBrandWindows } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';

export default function Auth() {
    const [isForgotMode, setIsForgotMode] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const resetSent = searchParams.get('reset') === 'sent';

    // Clear the query param once we've shown it
    useEffect(() => {
        if (resetSent) {
            // remove "?reset=sent" from URL
            setSearchParams({});
        }
    }, [resetSent, setSearchParams]);

    const form = useForm({
        initialValues: { email: '', password: '', remember: false },
        validate: {
            email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : 'Invalid email'),
            ...( !isForgotMode && { password: (v) => (v.length >= 6 ? null : 'Password too short') } ),
        },
    });

    const handleSubmit = async (values) => {
        if (isForgotMode) {
            // Forgot‐password flow
            try {
                const res = await fetch('/api/auth/forgot-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: values.email }),
                });
                // if (!res.ok) throw new Error('Email not found');
                // instead of toast, redirect back to login with flag
                window.location.href = '/login?reset=sent';
            } catch (err) {
                notifications.show({ title: 'Error', message: err.message, color: 'red' });
            }
        } else {
            // Login flow
            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(values),
                });
                if (!res.ok) throw new Error('Invalid credentials');
                const { token } = await res.json();
                localStorage.setItem('authToken', token);
                notifications.show({ title: 'Success', message: 'Logged in!' });
                window.location.href = '/dashboard';
            } catch (err) {
                form.setFieldError('password', err.message);
                notifications.show({ title: 'Error', message: err.message, color: 'red' });
            }
        }
    };

    return (
        <AuthLayout>
            <Stack spacing="xl" sx={{ width: 360 }}>
                {/* Inline alert for reset-success */}
                {resetSent && (
                    <Alert title="Success" color="green" variant="filled">
                        Reset link sent — please check your email.
                    </Alert>
                )}

                <Title order={2} align="center">
                    {isForgotMode ? 'Forgot Your Password?' : 'Login to continue'}
                </Title>

                <form onSubmit={form.onSubmit(handleSubmit)}>
                    <TextInput
                        label={isForgotMode ? 'Username or Email' : 'Email'}
                        placeholder="you@uni.edu"
                        required
                        mb="sm"
                        {...form.getInputProps('email')}
                    />

                    {!isForgotMode && (
                        <>
                            <PasswordInput
                                label="Password"
                                placeholder="Your password"
                                required
                                mb="sm"
                                {...form.getInputProps('password')}
                            />

                            <Group position="apart" mb="xl">
                                <Checkbox
                                    label="Remember me"
                                    {...form.getInputProps('remember', { type: 'checkbox' })}
                                />
                                <Anchor component="button" size="sm" onClick={() => setIsForgotMode(true)}>
                                    Forgot Password?
                                </Anchor>
                            </Group>
                        </>
                    )}

                    <Button type="submit" fullWidth mb="sm">
                        {isForgotMode ? 'Submit' : 'Login'}
                    </Button>

                    {isForgotMode && (
                        <Text align="center" size="sm" color="dimmed">
                            Enter your username or email address and we will send you instructions on how to create
                            a new password.
                        </Text>
                    )}
                </form>

                <Group position="center" spacing="xs">
                    {isForgotMode ? (
                        <Anchor component="button" size="sm" onClick={() => setIsForgotMode(false)}>
                            « Back to Login
                        </Anchor>
                    ) : (
                        <>
                            <Text size="sm" color="dimmed">
                                Or sign in with
                            </Text>
                            <Button
                                variant="outline"
                                fullWidth
                                leftSection={<IconBrandWindows size={20} />}
                                onClick={() => (window.location.href = '/api/auth/office365')}
                            >
                                Office 365
                            </Button>
                        </>
                    )}
                </Group>
            </Stack>
        </AuthLayout>
    );
}
