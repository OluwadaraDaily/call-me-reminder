import * as React from 'react';
import PhoneInputWithCountry from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';
import 'react-phone-number-input/style.css';
import { CountryCode } from 'libphonenumber-js';
import { cn } from '@/lib/utils';

export interface PhoneInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: string;
  onChange?: (value: string | undefined) => void;
  defaultCountry?: CountryCode;
  isValid?: boolean;
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ className, isValid, defaultCountry = 'US', value, onChange, ...props }, ref) => {
    return (
      <PhoneInputWithCountry
        ref={ref as any}
        flags={flags}
        defaultCountry={defaultCountry}
        value={value}
        onChange={onChange as any}
        international
        countryCallingCodeEditable={false}
        className={cn('phone-input-wrapper', className)}
        numberInputProps={{
          className: cn(
            // Base styles from Input component
            'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            // Focus styles
            'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
            // Error state styles
            'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
            // Valid state styles
            isValid && value && 'border-green-500 ring-green-500/20 ring-[3px]',
          ),
          ...props,
        }}
      />
    );
  }
);

PhoneInput.displayName = 'PhoneInput';

export { PhoneInput };
