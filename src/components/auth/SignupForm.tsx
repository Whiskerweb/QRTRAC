'use client';

import { LoginForm } from './LoginForm';

// Signup is now handled by the unified LoginForm component
// which includes role selection + login/signup toggle
export function SignupForm() {
    return <LoginForm />;
}
