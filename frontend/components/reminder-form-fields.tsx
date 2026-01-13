import { UseFormReturn } from 'react-hook-form';
import { CountryCode } from 'libphonenumber-js';
import { CheckCircle, XCircle } from 'lucide-react';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PhoneInput } from '@/components/ui/phone-input';
import { ReminderFormValues, TIMEZONE_OPTIONS, getMinDateTime } from '@/lib/reminder-utils';
import { isValidPhoneNumber, getPhoneNumberDetails } from '@/lib/phone-validation';

interface ReminderFormFieldsProps {
  form: UseFormReturn<ReminderFormValues>;
  defaultCountry: CountryCode;
  mode?: 'create' | 'edit';
}

export function ReminderFormFields({ form, defaultCountry, mode = 'create' }: ReminderFormFieldsProps) {
  return (
    <>
      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Title</FormLabel>
            <FormControl>
              <Input placeholder="Meeting with John" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="message"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Message</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Don't forget to bring the presentation slides"
                className="resize-none"
                rows={3}
                {...field}
              />
            </FormControl>
            <FormDescription>
              This message will be read to you during the call
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="phone_number"
        render={({ field }) => {
          const isValid = !!(field.value && isValidPhoneNumber(field.value));
          const phoneDetails = field.value ? getPhoneNumberDetails(field.value) : null;

          return (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <FormControl>
                <div className="relative">
                  <PhoneInput
                    {...field}
                    defaultCountry={defaultCountry}
                    isValid={isValid}
                  />
                  {field.value && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {isValid ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </div>
                  )}
                </div>
              </FormControl>
              <FormDescription>
                {phoneDetails?.example
                  ? `Format: ${phoneDetails.example}`
                  : 'Enter your phone number with country code'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          );
        }}
      />

      <FormField
        control={form.control}
        name="date_time"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Date & Time</FormLabel>
            <FormControl>
              <Input
                type="datetime-local"
                min={getMinDateTime()}
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="timezone"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Timezone</FormLabel>
            <Select onValueChange={field.onChange} value={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select your timezone" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {TIMEZONE_OPTIONS.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              Select the timezone for your reminder
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </>
  );
}
