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
import googleIconLogo from '../assets/google-icon-logo.svg';
import { COLORS, STORAGE_KEYS, OAUTH_CONFIG } from '../constants';
import { ENV, getOAuthRedirectUri } from '../env';
import { loginStyles } from './Login.styles';


export default function Auth() {
    const [isForgotMode, setIsForgotMode] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();
    const resetSent = searchParams.get('reset') === 'sent';
    const [gisLoaded, setGisLoaded] = useState(false);

    // Get Google Client ID from environment
    const GOOGLE_CLIENT_ID = ENV.GOOGLE_CLIENT_ID;

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
            sessionStorage.setItem(STORAGE_KEYS.GOOGLE_CODE_VERIFIER, codeVerifier);
            sessionStorage.setItem(STORAGE_KEYS.GOOGLE_STATE, state);
            sessionStorage.setItem(STORAGE_KEYS.GOOGLE_NONCE, nonce);

            // Initialize the code client
            window.google.accounts.oauth2.initCodeClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: OAUTH_CONFIG.GOOGLE_SCOPES,
                ux_mode: 'redirect',
                redirect_uri: getOAuthRedirectUri(),
                state: state,
                nonce: nonce,
                code_challenge: codeChallenge,
                code_challenge_method: OAUTH_CONFIG.PKCE_CODE_CHALLENGE_METHOD,
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
                localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
                notifications.show({ title: 'Success', message: 'Logged in!' });
                window.location.href = '/home';
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
                                leftSection={<img src={googleIconLogo} alt="Google" style={{ width: 20, height: 20 }} />}
                                onClick={handleGoogleSignIn}
                                disabled={!gisLoaded}
                                style={loginStyles.googleButton}
                                styles={{
                                    root: loginStyles.googleButtonHover,
                                    label: loginStyles.googleButtonLabel,
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
