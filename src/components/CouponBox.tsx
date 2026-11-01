import { FormField } from '@shoplab/ui-kit';
import { useState, type FormEvent } from 'react';

export interface CouponBoxProps {
  applied: string | null;
  onApply: (code: string) => void;
}

export function CouponBox({ applied, onApply }: CouponBoxProps) {
  const [code, setCode] = useState('');
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (code.trim()) onApply(code.trim());
  };
  return (
    <form onSubmit={submit}>
      <FormField label="Coupon code" name="coupon">
        <input id="coupon" value={code} onChange={(e) => setCode(e.target.value)} />
      </FormField>
      <button type="submit">Apply</button>
      {applied && <p>Coupon {applied} applied</p>}
    </form>
  );
}
