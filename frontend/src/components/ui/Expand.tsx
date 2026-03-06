import type { ReactNode } from 'react';

export default function Expand({ open, children, className = '' }: { open: boolean; children: ReactNode; className?: string }) {
  return (
    <div className={`expand-wrapper ${className}`} data-open={open}>
      <div className="expand-inner">{children}</div>
    </div>
  );
}
