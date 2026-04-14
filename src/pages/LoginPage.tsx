import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getCompany } from '@/store/dataStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const { login } = useAuth();
  const company = getCompany();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required');
      return;
    }
    const err = login(username.trim(), password.trim());
    if (err) setError(err);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          {company.logoDataUrl && (
            <img src={company.logoDataUrl} alt="Logo" className="h-16 mx-auto object-contain" />
          )}
          <CardTitle className="text-xl">{company.companyName}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <Input value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" />
            </div>
            <Button type="submit" className="w-full">Sign In</Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-4">Default: admin / admin123</p>
        </CardContent>
      </Card>
    </div>
  );
}
