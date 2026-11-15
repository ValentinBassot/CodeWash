import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import SaveProblemNotice from './SaveProblemNotice';

describe('SaveProblemNotice', () => {
    it('says that the save was unreadable and that a backup was kept', () => {
        render(<SaveProblemNotice problem="corrupted" onDismiss={() => {}} />);
        expect(screen.getByRole('alert').textContent).toContain('could not be read');
        expect(screen.getByRole('alert').textContent).toContain('backup');
    });

    it('goes away when dismissed', () => {
        const onDismiss = vi.fn();
        render(<SaveProblemNotice problem="corrupted" onDismiss={onDismiss} />);
        fireEvent.click(screen.getByRole('button', { name: 'OK' }));
        expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('shows nothing without a problem', () => {
        render(<SaveProblemNotice problem={null} onDismiss={() => {}} />);
        expect(screen.queryByRole('alert')).toBeNull();
    });
});
