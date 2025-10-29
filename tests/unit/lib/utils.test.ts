import { cn } from '../../../src/lib/utils';

describe('Common Utils', () => {
  describe('cn (className utility)', () => {
    it('should merge single class', () => {
      const result = cn('px-2');
      expect(result).toBe('px-2');
    });

    it('should merge multiple classes', () => {
      const result = cn('px-2', 'py-1');
      expect(result).toContain('px-2');
      expect(result).toContain('py-1');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const result = cn('px-2', isActive && 'bg-blue-500');
      expect(result).toContain('px-2');
      expect(result).toContain('bg-blue-500');
    });

    it('should exclude falsy conditional classes', () => {
      const isActive = false;
      const result = cn('px-2', isActive && 'bg-blue-500');
      expect(result).toBe('px-2');
      expect(result).not.toContain('bg-blue-500');
    });

    it('should handle arrays of classes', () => {
      const result = cn(['px-2', 'py-1']);
      expect(result).toContain('px-2');
      expect(result).toContain('py-1');
    });

    it('should handle objects with boolean values', () => {
      const result = cn({
        'px-2': true,
        'bg-blue-500': false,
        'py-1': true,
      });
      expect(result).toContain('px-2');
      expect(result).toContain('py-1');
      expect(result).not.toContain('bg-blue-500');
    });

    it('should handle undefined values', () => {
      const result = cn('px-2', undefined, 'py-1');
      expect(result).toContain('px-2');
      expect(result).toContain('py-1');
    });

    it('should handle null values', () => {
      const result = cn('px-2', null, 'py-1');
      expect(result).toContain('px-2');
      expect(result).toContain('py-1');
    });

    it('should handle empty strings', () => {
      const result = cn('px-2', '', 'py-1');
      expect(result).toContain('px-2');
      expect(result).toContain('py-1');
    });

    it('should resolve Tailwind conflicts correctly', () => {
      // When there are conflicting Tailwind classes, twMerge should resolve them
      // p-2 and px-4 conflict on horizontal padding - px-4 should win
      const result = cn('p-2', 'px-4');
      expect(result).toContain('px-4');
      // The result should be a properly resolved Tailwind class string
      expect(result).toBeTruthy();
    });

    it('should resolve bg color conflicts', () => {
      // bg-red-500 and bg-blue-500 conflict - blue should win
      const result = cn('bg-red-500', 'bg-blue-500');
      expect(result).toContain('bg-blue-500');
      expect(result).not.toContain('bg-red-500');
    });

    it('should handle text color and weight together', () => {
      const result = cn('text-red-500', 'font-bold');
      expect(result).toContain('text-red-500');
      expect(result).toContain('font-bold');
    });

    it('should work with responsive classes', () => {
      const result = cn('md:px-4', 'lg:px-6', 'px-2');
      expect(result).toContain('md:px-4');
      expect(result).toContain('lg:px-6');
      expect(result).toContain('px-2');
    });

    it('should work with dark mode classes', () => {
      const result = cn('bg-white', 'dark:bg-slate-900');
      expect(result).toContain('bg-white');
      expect(result).toContain('dark:bg-slate-900');
    });

    it('should handle complex combinations', () => {
      const size = 'lg';
      const isDisabled = true;
      const result = cn(
        'px-2 py-1',
        size === 'lg' && 'px-4 py-2',
        isDisabled && 'opacity-50 cursor-not-allowed',
      );
      expect(result).toContain('px-4');
      expect(result).toContain('py-2');
      expect(result).toContain('opacity-50');
      expect(result).toContain('cursor-not-allowed');
    });

    it('should handle mixed input types', () => {
      const result = cn('px-2', ['py-1'], { 'bg-blue-500': true }, 'rounded');
      expect(result).toContain('px-2');
      expect(result).toContain('py-1');
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('rounded');
    });

    it('should trim whitespace', () => {
      const result = cn('  px-2  ', '  py-1  ');
      // Result should not have extra spaces
      expect(result.trim()).toBe(result);
    });

    it('should be composable', () => {
      const baseClasses = 'px-2 py-1';
      const variantClasses = 'bg-blue-500 text-white';
      const result = cn(baseClasses, variantClasses);
      expect(result).toContain('px-2');
      expect(result).toContain('py-1');
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('text-white');
    });

    it('should handle button component styling', () => {
      const variant = 'primary';
      const result = cn(
        'inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background',
        variant === 'primary' && 'bg-blue-500 text-white hover:bg-blue-600',
        variant === 'secondary' && 'bg-gray-200 text-black hover:bg-gray-300',
      );
      expect(result).toContain('inline-flex');
      expect(result).toContain('items-center');
      expect(result).toContain('justify-center');
      expect(result).toContain('rounded-md');
      expect(result).toContain('bg-blue-500');
      expect(result).toContain('text-white');
    });

    it('should handle card component styling', () => {
      const elevation = 'md';
      const result = cn(
        'rounded-lg border bg-card text-card-foreground',
        elevation === 'md' && 'shadow-md',
        elevation === 'lg' && 'shadow-lg',
      );
      expect(result).toContain('rounded-lg');
      expect(result).toContain('border');
      expect(result).toContain('bg-card');
      expect(result).toContain('shadow-md');
    });

    it('should handle form input styling', () => {
      const isError = false;
      const isDisabled = false;
      const result = cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
        isError && 'border-red-500 focus:border-red-500',
        isDisabled && 'cursor-not-allowed opacity-50',
      );
      expect(result).toContain('flex');
      expect(result).toContain('h-10');
      expect(result).toContain('w-full');
      expect(result).toContain('rounded-md');
      expect(result).not.toContain('border-red-500');
      expect(result).not.toContain('opacity-50');
    });

    it('should handle responsive grid layout', () => {
      const result = cn(
        'grid gap-4',
        'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      );
      expect(result).toContain('grid');
      expect(result).toContain('gap-4');
      expect(result).toContain('grid-cols-1');
      expect(result).toContain('sm:grid-cols-2');
      expect(result).toContain('lg:grid-cols-3');
    });

    it('should preserve specificity order', () => {
      const result = cn('p-4', 'px-2');
      // px-2 should override the horizontal padding from p-4
      // twMerge resolves conflicts, so both might not appear together
      expect(result).toContain('px-2');
      // The result should still have vertical padding properties
      expect(result).toMatch(/p-|y-/);
    });

    it('should handle animation and transition classes', () => {
      const result = cn('transition-all duration-200', 'hover:opacity-80');
      expect(result).toContain('transition-all');
      expect(result).toContain('duration-200');
      expect(result).toContain('hover:opacity-80');
    });

    it('should not mutate input values', () => {
      const class1 = 'px-2';
      const class2 = 'py-1';
      cn(class1, class2);
      expect(class1).toBe('px-2');
      expect(class2).toBe('py-1');
    });

    it('should handle empty input', () => {
      const result = cn('');
      expect(result).toBe('');
    });

    it('should handle no arguments', () => {
      const result = cn();
      expect(result).toBe('');
    });

    it('should handle all falsy conditions', () => {
      const result = cn(false && 'px-2', null, undefined, '');
      expect(result).toBe('');
    });
  });

  describe('cn - Real world component examples', () => {
    it('should style a button with different variants', () => {
      const buttonClasses = (variant: 'primary' | 'secondary' | 'outline') => {
        return cn(
          'px-4 py-2 rounded-lg font-medium transition-colors',
          variant === 'primary' &&
            'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700',
          variant === 'secondary' &&
            'bg-gray-500 text-white hover:bg-gray-600 active:bg-gray-700',
          variant === 'outline' &&
            'border-2 border-blue-500 text-blue-500 hover:bg-blue-50',
        );
      };

      const primaryResult = buttonClasses('primary');
      expect(primaryResult).toContain('bg-blue-500');
      expect(primaryResult).not.toContain('border-2');

      const outlineResult = buttonClasses('outline');
      expect(outlineResult).toContain('border-2');
      expect(outlineResult).toContain('border-blue-500');
    });

    it('should style a badge with different colors', () => {
      const badgeClasses = (color: 'blue' | 'red' | 'green') => {
        return cn(
          'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
          color === 'blue' && 'bg-blue-100 text-blue-700',
          color === 'red' && 'bg-red-100 text-red-700',
          color === 'green' && 'bg-green-100 text-green-700',
        );
      };

      const result = badgeClasses('blue');
      expect(result).toContain('inline-flex');
      expect(result).toContain('bg-blue-100');
      expect(result).toContain('text-blue-700');
    });

    it('should handle loading state styling', () => {
      const isLoading = true;
      const result = cn(
        'px-4 py-2 rounded-lg bg-blue-500 text-white',
        isLoading && 'opacity-60 cursor-not-allowed pointer-events-none',
      );
      expect(result).toContain('opacity-60');
      expect(result).toContain('cursor-not-allowed');
    });

    it('should handle modal backdrop styling', () => {
      const result = cn(
        'fixed inset-0',
        'bg-black/50 backdrop-blur-sm',
        'flex items-center justify-center',
        'z-50',
      );
      expect(result).toContain('fixed');
      expect(result).toContain('inset-0');
      expect(result).toContain('bg-black');
      expect(result).toContain('backdrop-blur-sm');
      expect(result).toContain('z-50');
    });
  });
});
