// pages/GoogleAuthCallback.jsx
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { Box, Loader, Text } from '@mantine/core';

export default function GoogleAuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');

        // Get stored PKCE parameters from sessionStorage
        const storedCodeVerifier = sessionStorage.getItem('google_code_verifier');
        const storedState = sessionStorage.getItem('google_state');
        const storedNonce = sessionStorage.getItem('google_nonce');

        if (error) {
            // Clean up sessionStorage
            sessionStorage.removeItem('google_code_verifier');
            sessionStorage.removeItem('google_state');
            sessionStorage.removeItem('google_nonce');
            
            notifications.show({
                title: 'Authentication Failed',
                message: error,
                color: 'red',
            });
            navigate('/login');
            return;
        }

        // Validate we have all required parameters
        if (!code || !state || !storedCodeVerifier || !storedState || !storedNonce) {
            notifications.show({
                title: 'Error',
                message: 'Invalid authentication response - missing required parameters',
                color: 'red',
            });
            navigate('/login');
            return;
        }

        // Verify state matches (CSRF protection)
        if (state !== storedState) {
            // Clean up sessionStorage
            sessionStorage.removeItem('google_code_verifier');
            sessionStorage.removeItem('google_state');
            sessionStorage.removeItem('google_nonce');
            
            notifications.show({
                title: 'Error',
                message: 'Invalid state parameter - possible CSRF attack',
                color: 'red',
            });
            navigate('/login');
            return;
        }

        // Get backend URL
        const getBackendUrl = () => {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1';
            const backendHost = import.meta.env.VITE_API_HOST || window.location.origin;
            
            if (apiBaseUrl.startsWith('http://') || apiBaseUrl.startsWith('https://')) {
                return `${apiBaseUrl}/auth/google/callback`;
            }
            const basePath = apiBaseUrl.startsWith('/') ? apiBaseUrl : `/${apiBaseUrl}`;
            return `${backendHost}${basePath}/auth/google/callback`;
        };

        // Send code and verifier to backend
        fetch(getBackendUrl(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code,
                code_verifier: storedCodeVerifier,
                state,
                nonce: storedNonce,
            }),
        })
            .then(async (res) => {
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({ message: 'Failed to authenticate' }));
                    throw new Error(errorData.message || 'Failed to authenticate');
                }
                const data = await res.json();
                
                // Clean up sessionStorage
                sessionStorage.removeItem('google_code_verifier');
                sessionStorage.removeItem('google_state');
                sessionStorage.removeItem('google_nonce');
                
                // Store token
                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                    
                    notifications.show({
                        title: 'Success',
                        message: 'Logged in with Google!',
                        color: 'green',
                    });
                    navigate('/dashboard');
                } else {
                    throw new Error('No token received from backend');
                }
            })
            .catch((err) => {
                console.error('Auth callback error:', err);
                
                // Clean up sessionStorage
                sessionStorage.removeItem('google_code_verifier');
                sessionStorage.removeItem('google_state');
                sessionStorage.removeItem('google_nonce');
                
                notifications.show({
                    title: 'Error',
                    message: err.message || 'Failed to complete authentication',
                    color: 'red',
                });
                navigate('/login');
            });
    }, [searchParams, navigate]);

    return (
        <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <Loader size="lg" />
            <Text mt="md">Completing authentication...</Text>
        </Box>
    );
}
