import { Money } from '@shoplab/ui-kit';
import type { CartLine } from '../types.ts';

export interface CartLinesProps {
  lines: CartLine[];
  currency: string;
  names: Record<string, string>;
  onQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

export function CartLines({ lines, currency, names, onQuantity, onRemove }: CartLinesProps) {
  return (
    <ul>
      {lines.map((l) => {
        const name = names[l.productId] ?? l.productId;
        return (
          <li key={l.productId}>
            <span>{name}</span>{' '}
            <Money amount={l.unitPrice} currency={currency as 'USD'} />
            {l.latestUnitPrice !== undefined && (
              <small> (now <Money amount={l.latestUnitPrice} currency={currency as 'USD'} />)</small>
            )}{' '}
            <button type="button" aria-label={`Decrease ${name}`} onClick={() => onQuantity(l.productId, l.quantity - 1)}>−</button>
            <span aria-label={`Quantity of ${name}`}>{l.quantity}</span>
            <button type="button" aria-label={`Increase ${name}`} onClick={() => onQuantity(l.productId, l.quantity + 1)}>+</button>{' '}
            <button type="button" aria-label={`Remove ${name}`} onClick={() => onRemove(l.productId)}>Remove</button>
          </li>
        );
      })}
    </ul>
  );
}
