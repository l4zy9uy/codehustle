// pages/Login.jsx
import React, { useState, useEffect, useCallback } from 'react';
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
import { notifications } from '@mantine/notifications';
import { useSearchParams } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { login as loginApi, forgotPassword } from '../lib/api/auth';
import { generateCodeVerifier, generateCodeChallenge, generateState, generateNonce } from '../utils/pkce';

// Google logo component with 4 colors (blue, red, yellow, green)
const GoogleLogo = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
);

export default function Auth() {
    const [isForgotMode, setIsForgotMode] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const resetSent = searchParams.get('reset') === 'sent';
    const [gisLoaded, setGisLoaded] = useState(false);

    // Get Google Client ID from environment variable
    const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    // Get backend URL for OAuth redirect
    // VITE_API_BASE_URL can be a full URL (http://localhost:3000) or a path (/api)
    const getBackendRedirectUri = () => {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
        // If it's already a full URL, use it directly
        if (apiBaseUrl.startsWith('http://') || apiBaseUrl.startsWith('https://')) {
            return `${apiBaseUrl}/auth/google/callback`;
        }
        // If it's a path, construct full URL from window location
        // For OAuth, we need the backend host - use VITE_API_HOST if available, otherwise use current origin
        const backendHost = import.meta.env.VITE_API_HOST || window.location.origin;
        const basePath = apiBaseUrl.startsWith('/') ? apiBaseUrl : `/${apiBaseUrl}`;
        return `${backendHost}${basePath}/auth/google/callback`;
    };

    // Check if Google Identity Services is loaded
    useEffect(() => {
        const checkGIS = () => {
            if (window.google?.accounts?.oauth2) {
                setGisLoaded(true);
            } else {
                setTimeout(checkGIS, 100);
            }
        };
        checkGIS();
    }, []);

    // Clear the query param once we've shown it
    useEffect(() => {
        if (resetSent) {
            setSearchParams({});
        }
    }, [resetSent, setSearchParams]);

    // Handle Google Sign-In with Code Flow + PKCE
    const handleGoogleSignIn = useCallback(async () => {
        if (!gisLoaded || !window.google?.accounts?.oauth2) {
            notifications.show({
                title: 'Error',
                message: 'Google Identity Services not loaded yet',
                color: 'red',
            });
            return;
        }

        if (!GOOGLE_CLIENT_ID) {
            notifications.show({
                title: 'Error',
                message: 'Google Client ID not configured',
                color: 'red',
            });
            return;
        }

        try {
            // Generate PKCE parameters
            const codeVerifier = generateCodeVerifier();
            const codeChallenge = await generateCodeChallenge(codeVerifier);
            const state = generateState();
            const nonce = generateNonce();

            // Store PKCE verifier and state in sessionStorage for validation after redirect
            sessionStorage.setItem('google_code_verifier', codeVerifier);
            sessionStorage.setItem('google_state', state);
            sessionStorage.setItem('google_nonce', nonce);

            // Initialize the code client
            window.google.accounts.oauth2.initCodeClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: 'openid email profile',
                ux_mode: 'redirect',
                redirect_uri: getBackendRedirectUri(),
                state: state,
                nonce: nonce,
                code_challenge: codeChallenge,
                code_challenge_method: 'S256',
            }).requestCode();
        } catch (error) {
            console.error('Google Sign-In error:', error);
            notifications.show({
                title: 'Error',
                message: 'Failed to initiate Google Sign-In',
                color: 'red',
            });
        }
    }, [gisLoaded, GOOGLE_CLIENT_ID]);

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
                                fullWidth
                                leftSection={<GoogleLogo size={20} />}
                                onClick={handleGoogleSignIn}
                                disabled={!gisLoaded}
                                style={{
                                    backgroundColor: '#424242',
                                    border: '1px solid #e0e0e0',
                                    color: '#ffffff',
                                    borderRadius: '24px',
                                    height: '48px',
                                }}
                                styles={{
                                    root: {
                                        '&:hover': {
                                            backgroundColor: '#353535',
                                        },
                                        '&:disabled': {
                                            backgroundColor: '#424242',
                                            opacity: 0.6,
                                        },
                                    },
                                    label: {
                                        color: '#ffffff',
                                    },
                                }}
                            >
                                Continue with Google
                            </Button>
                        </>
                    )}
                </Group>
            </Stack>
        </AuthLayout>
    );
}
