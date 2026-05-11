import { Route, Routes } from 'react-router-dom'
import { AuthCallbackPage } from '../pages/AuthCallbackPage'
import { LoginPage } from '../pages/LoginPage'

type UnauthenticatedAppProps = {
  callbackMessage: string
  loginError?: string
  onLogin: () => Promise<void>
}

export function UnauthenticatedApp({
  callbackMessage,
  loginError,
  onLogin,
}: Readonly<UnauthenticatedAppProps>) {
  return (
    <Routes>
      <Route path="/auth/callback" element={<AuthCallbackPage message={callbackMessage} />} />
      <Route path="*" element={<LoginPage onLogin={onLogin} loginError={loginError} />} />
    </Routes>
  )
}
