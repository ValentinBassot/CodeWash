import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import NotificationStack from './NotificationStack';

describe('NotificationStack', () => {
    it('shows its notifications one under the other, above everything, without catching clicks', () => {
        render(
            <NotificationStack>
                <p>first</p>
                <p>second</p>
            </NotificationStack>,
        );
        const stack = screen.getByText('first').parentElement;
        expect(stack.contains(screen.getByText('second'))).toBe(true);
        expect(stack.className).toContain('fixed');
        expect(stack.className).toContain('flex-col');
        expect(stack.className).toContain('z-[90]');
        expect(stack.className).toContain('pointer-events-none');
    });

    it('keeps inside the window: the width is the window minus a margin, and the top clears the corner buttons', () => {
        render(<NotificationStack>x</NotificationStack>);
        const { className } = screen.getByText('x');
        expect(className).toContain('w-[calc(100vw-1.5rem)]');
        expect(className).toContain('md:w-[min(42rem,calc(100vw-26rem))]');
        expect(className).toContain('top-16');
    });
});
