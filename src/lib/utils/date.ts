import { format, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

export function formatDate(date: string | Date, pattern = 'yyyy년 MM월 dd일'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, pattern, { locale: ko });
}

export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
}

export function formatBirthDate(date: string): string {
  return formatDate(date, 'yyyy-MM-dd');
}
