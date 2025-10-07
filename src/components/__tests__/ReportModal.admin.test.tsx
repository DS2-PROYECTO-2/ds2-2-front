import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportModal from '../rooms/ReportModal';
import { vi } from 'vitest';

vi.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({ user: { role: 'admin' } })
}));

describe('ReportModal admin actions', () => {
  const computer = { id: '1', roomId: 'r1', number: 1, serial: 'S1', status: 'operational' } as any;
  const reports = [
    { id: '10', computerId: '1', reporter: 'Admin', issues: ['hardware'], description: 'x', date: '01/01/2025, 12:00', status: 'pending' }
  ] as any;

  it('muestra botón Eliminar y dispara onDeleteReport', async () => {
    const onDeleteReport = vi.fn().mockResolvedValue(undefined);
    // Interceptar dispatchEvent para confirmar automáticamente
    const origDispatch = window.dispatchEvent;
    vi.spyOn(window, 'dispatchEvent').mockImplementation(((evt: Event) => {
      const anyEvt = evt as any;
      if (anyEvt?.type === 'app-confirm' && anyEvt.detail?.onConfirm) {
        anyEvt.detail.onConfirm();
      }
      return origDispatch.call(window, evt);
    }) as any);

    render(
      <ReportModal computer={computer} reports={reports} onClose={() => {}} onDeleteReport={onDeleteReport} />
    );

    const btn = await screen.findByText('🗑 Eliminar');
    fireEvent.click(btn);

    await waitFor(() => expect(onDeleteReport).toHaveBeenCalledWith('10'));
  });
});


