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
import { IconBrandGoogle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { login as loginApi, forgotPassword } from '../lib/api/auth';

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
                await forgotPassword(values.email);
                // redirect back to login with flag
                window.location.href = '/login?reset=sent';
            } catch (err) {
                notifications.show({ title: 'Error', message: err.message, color: 'red' });
            }
        } else {
            // Login flow
            try {
                const { token } = await loginApi(values);
                localStorage.setItem('authToken', token);
                notifications.show({ title: 'Success', message: 'Logged in!' });
                window.location.href = '/dashboard';
            } catch (err) {
                const message = err?.message || 'Invalid credentials';
                form.setFieldError('password', message);
                notifications.show({ title: 'Error', message, color: 'red' });
            }
        }
    };

    return (
        <AuthLayout>
            <Stack spacing="xl" style={{ width: 480, marginLeft: '16px', marginRight: '16px' }}>
                {/* Inline alert for reset-success */}
                {resetSent && (
                    <Alert title="Success" color="green" variant="filled">
                        Reset link sent — please check your email.
                    </Alert>
                )}

                <Title order={2} align="center">
                    {isForgotMode ? 'Forgot Your Password?' : 'Login to continue'}
                </Title>

                <form onSubmit={form.onSubmit(handleSubmit)} >
                    <TextInput
                        placeholder={isForgotMode ? 'Enter your username or email' : 'Enter your email address'}
                        required
                        mb="sm"
                        radius="md"
                        sx={{ width: "1480px" }}
                        {...form.getInputProps('email')}
                    />

                    {!isForgotMode && (
                        <>
                            <PasswordInput
                                placeholder="Enter your password"
                                required
                                mb="sm"
                                radius="md"
                                sx={{ width: '100%' }}
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
                                leftSection={<IconBrandGoogle size={20} />}
                                onClick={() => (window.location.href = '/api/auth/google')}
                            >
                                Google
                            </Button>
                        </>
                    )}
                </Group>
            </Stack>
        </AuthLayout>
    );
}
