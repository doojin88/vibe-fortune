'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type TimePickerProps = {
  value?: string;
  onChange?: (time: string) => void;
  disabled?: boolean;
};

export function TimePicker({ value, onChange, disabled }: TimePickerProps) {
  const [hour, setHour] = React.useState('');
  const [minute, setMinute] = React.useState('');

  React.useEffect(() => {
    if (value) {
      const [h, m] = value.split(':');
      setHour(h || '');
      setMinute(m || '');
    }
  }, [value]);

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    const numVal = parseInt(val, 10);

    if (val === '' || (numVal >= 0 && numVal <= 23)) {
      setHour(val);
      if (val.length === 2 && minute) {
        onChange?.(`${val.padStart(2, '0')}:${minute.padStart(2, '0')}`);
      }
    }
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 2);
    const numVal = parseInt(val, 10);

    if (val === '' || (numVal >= 0 && numVal <= 59)) {
      setMinute(val);
      if (hour && val.length === 2) {
        onChange?.(`${hour.padStart(2, '0')}:${val.padStart(2, '0')}`);
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        <Input
          type="text"
          placeholder="00"
          value={hour}
          onChange={handleHourChange}
          disabled={disabled}
          className="w-16 text-center"
          maxLength={2}
        />
        <Label>시</Label>
      </div>
      <span className="text-muted-foreground">:</span>
      <div className="flex items-center gap-1">
        <Input
          type="text"
          placeholder="00"
          value={minute}
          onChange={handleMinuteChange}
          disabled={disabled}
          className="w-16 text-center"
          maxLength={2}
        />
        <Label>분</Label>
      </div>
    </div>
  );
}
