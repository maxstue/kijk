import { Checkbox } from '@kijk/ui/components/checkbox';
import { Label } from '@kijk/ui/components/label';
import { useId } from 'react';

interface UploadConsentProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}
export function UploadConsent({ checked, onChange }: UploadConsentProps) {
  const consentId = useId();
  return (
    <div className='flex items-start gap-3 rounded border p-4'>
      <Checkbox checked={checked} id={consentId} onCheckedChange={(checked) => onChange(checked === true)} />
      <Label className='block text-sm leading-relaxed font-normal' htmlFor={consentId}>
        I explicitly consent to Kijk storing and processing my bank transactions, although they can reveal sensitive
        information, for example about my health, religion, political opinions or union membership (GDPR Article
        9(2)(a)). I can withdraw this consent at any time in Settings → Info; Kijk then no longer imports bank exports
        for me.{' '}
        <a
          className='text-foreground underline underline-offset-4'
          href='/privacy'
          rel='noopener noreferrer'
          target='_blank'
        >
          Privacy Policy
        </a>
      </Label>
    </div>
  );
}
