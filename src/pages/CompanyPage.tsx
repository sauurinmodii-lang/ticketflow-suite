import { useState, useRef } from 'react';
import { getCompany, saveCompany } from '@/store/dataStore';
import { logAudit } from '@/lib/audit';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X } from 'lucide-react';

export default function CompanyPage() {
  const { currentUser } = useAuth();
  const [company, setCompany] = useState(getCompany);
  const [name, setName] = useState(company.companyName);
  const [logoPreview, setLogoPreview] = useState<string | null>(company.logoDataUrl);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file'); return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be under 2MB'); return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        if (img.width < 64 || img.height < 64) { setError('Minimum dimensions: 64x64px'); return; }
        if (img.width > 1024 || img.height > 512) { setError('Maximum dimensions: 1024x512px'); return; }
        setLogoPreview(reader.result as string);
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!name.trim()) { setError('Company name is required'); return; }
    const updated = { companyName: name.trim(), logoDataUrl: logoPreview };
    saveCompany(updated);
    setCompany(updated);
    logAudit({ entityType: 'Company', entityId: 'profile', action: 'Updated', userId: currentUser!.id, userName: currentUser!.fullName, newValue: name.trim() });
    setSuccess('Company profile saved!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const removeLogo = () => { setLogoPreview(null); };

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">Company Profile</h1>
      <Card>
        <CardHeader><CardTitle className="text-base">Branding Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>}
          {success && <div className="text-sm text-success bg-success/10 p-3 rounded-md">{success}</div>}

          <div className="space-y-2">
            <label className="text-sm font-medium">Company Name *</label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Company Logo</label>
            <p className="text-xs text-muted-foreground">Min 64x64, Max 1024x512, under 2MB</p>
            {logoPreview ? (
              <div className="relative inline-block border rounded-md p-3">
                <img src={logoPreview} alt="Logo preview" className="h-20 object-contain" />
                <button onClick={removeLogo} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1">
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed rounded-md p-8 text-center cursor-pointer hover:border-primary transition-colors"
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload logo</p>
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>

          <Button onClick={handleSave} className="w-full">Save Profile</Button>
        </CardContent>
      </Card>
    </div>
  );
}
