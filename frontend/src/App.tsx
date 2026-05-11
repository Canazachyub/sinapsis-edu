import { AuthProvider } from '@/hooks/useAuth';
import { Router } from './router';

export default function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}
