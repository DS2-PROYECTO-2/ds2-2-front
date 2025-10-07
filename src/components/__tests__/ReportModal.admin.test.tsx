import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportModal from '../rooms/ReportModal';
import type { Computer, Report } from '../../types';
import { vi } from 'vitest';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { role: 'admin' } })
}));

describe('ReportModal admin actions', () => {
  const computer: Computer = { id: '1', roomId: 'r1', number: 1, serial: 'S1', status: 'operational' } as Computer;
  const reports: Report[] = [
    { id: '10', computerId: '1', reporter: 'Admin', issues: ['hardware'], description: 'x', date: '01/01/2025, 12:00', status: 'pending' }
  ] as Report[];

  it('muestra botón Eliminar y dispara onDeleteReport', async () => {
    const onDeleteReport = vi.fn<[], Promise<void>>().mockResolvedValue(undefined);
    // Interceptar dispatchEvent para confirmar automáticamente
    const origDispatch = window.dispatchEvent;
    vi.spyOn(window, 'dispatchEvent').mockImplementation(((evt: Event) => {
      const anyEvt = evt as CustomEvent<{ onConfirm?: () => void }>;
      if (anyEvt?.type === 'app-confirm' && anyEvt.detail?.onConfirm) {
        anyEvt.detail.onConfirm();
      }
      return origDispatch.call(window, evt);
    }) as unknown as typeof window.dispatchEvent);

    render(
      <ReportModal computer={computer} reports={reports} onClose={() => {}} onDeleteReport={onDeleteReport} />
    );

    const btn = await screen.findByText('🗑 Eliminar');
    fireEvent.click(btn);

    await waitFor(() => expect(onDeleteReport).toHaveBeenCalledWith('10'));
  });
});


