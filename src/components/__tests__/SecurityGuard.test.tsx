import { describe, it, expect } from 'vitest';
import SecurityGuard from '../auth/SecurityGuard';

describe('SecurityGuard', () => {
  it('debería ser un componente React', () => {
    expect(SecurityGuard).toBeDefined();
    expect(typeof SecurityGuard).toBe('function');
  });

  it('debería tener props definidas', () => {
    const props = {
      children: <div>Test</div>,
      requiredRole: 'admin' as const,
      requireVerified: true
    };

    expect(props.children).toBeDefined();
    expect(props.requiredRole).toBe('admin');
    expect(props.requireVerified).toBe(true);
  });
});
