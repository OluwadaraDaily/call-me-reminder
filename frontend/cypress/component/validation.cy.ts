import {
  emailSchema,
  passwordSchema,
  loginSchema,
  signupSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  passwordChangeSchema,
} from '../../lib/validation';
import { reminderFormSchema } from '../../lib/reminder-utils';

describe('Validation Schemas', () => {
  describe('emailSchema', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.uk',
        'user_name@example-domain.com',
        'user123@subdomain.example.com',
      ];

      validEmails.forEach(email => {
        const result = emailSchema.safeParse(email);
        expect(result.success, `Email should be valid: ${email}`).to.be.true;
      });
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
        'user..name@example.com',
      ];

      invalidEmails.forEach(email => {
        const result = emailSchema.safeParse(email);
        expect(result.success, `Email should be invalid: ${email}`).to.be.false;
      });
    });

    it('should require email to be non-empty', () => {
      const result = emailSchema.safeParse('');
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.issues[0].message).to.include('Email is required');
      }
    });

    it('should provide appropriate error messages', () => {
      const invalidResult = emailSchema.safeParse('invalid');
      expect(invalidResult.success).to.be.false;
      if (!invalidResult.success) {
        expect(invalidResult.error.issues[0].message).to.include('Invalid email');
      }

      const emptyResult = emailSchema.safeParse('');
      expect(emptyResult.success).to.be.false;
      if (!emptyResult.success) {
        expect(emptyResult.error.issues[0].message).to.include('required');
      }
    });
  });

  describe('passwordSchema', () => {
    it('should validate strong passwords', () => {
      const validPasswords = [
        'Password1',
        'MyP@ssw0rd',
        'Str0ngP@ss',
        'Abcdef123',
        'Test1234Pass',
      ];

      validPasswords.forEach(password => {
        const result = passwordSchema.safeParse(password);
        expect(result.success, `Password should be valid: ${password}`).to.be.true;
      });
    });

    it('should reject passwords without uppercase letter', () => {
      const result = passwordSchema.safeParse('password123');
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.issues[0].message).to.include('uppercase');
      }
    });

    it('should reject passwords without lowercase letter', () => {
      const result = passwordSchema.safeParse('PASSWORD123');
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.issues[0].message).to.include('lowercase');
      }
    });

    it('should reject passwords without digit', () => {
      const result = passwordSchema.safeParse('PasswordOnly');
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.issues[0].message).to.include('digit');
      }
    });

    it('should reject passwords shorter than 8 characters', () => {
      const result = passwordSchema.safeParse('Pass1');
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.issues[0].message).to.include('8 characters');
      }
    });

    it('should reject passwords longer than 128 characters', () => {
      const longPassword = 'P1' + 'a'.repeat(128);
      const result = passwordSchema.safeParse(longPassword);
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.issues[0].message).to.include('128 characters');
      }
    });

    it('should accept passwords with special characters', () => {
      const passwordsWithSpecialChars = [
        'P@ssw0rd!',
        'My#Pass123',
        'Test$123Pass',
        'Pass%word1',
      ];

      passwordsWithSpecialChars.forEach(password => {
        const result = passwordSchema.safeParse(password);
        expect(result.success, `Password with special char should be valid: ${password}`).to.be.true;
      });
    });
  });

  describe('loginSchema', () => {
    it('should validate correct login data', () => {
      const validLogin = {
        email: 'user@example.com',
        password: 'Password123',
        rememberMe: true,
      };

      const result = loginSchema.safeParse(validLogin);
      expect(result.success).to.be.true;
    });

    it('should reject login with invalid email', () => {
      const invalidLogin = {
        email: 'invalid-email',
        password: 'Password123',
        rememberMe: false,
      };

      const result = loginSchema.safeParse(invalidLogin);
      expect(result.success).to.be.false;
    });

    it('should reject login with invalid password', () => {
      const invalidLogin = {
        email: 'user@example.com',
        password: 'weak',
        rememberMe: false,
      };

      const result = loginSchema.safeParse(invalidLogin);
      expect(result.success).to.be.false;
    });

    it('should accept rememberMe as boolean', () => {
      const loginTrue = {
        email: 'user@example.com',
        password: 'Password123',
        rememberMe: true,
      };

      const loginFalse = {
        email: 'user@example.com',
        password: 'Password123',
        rememberMe: false,
      };

      expect(loginSchema.safeParse(loginTrue).success).to.be.true;
      expect(loginSchema.safeParse(loginFalse).success).to.be.true;
    });
  });

  describe('signupSchema', () => {
    it('should validate correct signup data with matching passwords', () => {
      const validSignup = {
        email: 'user@example.com',
        password: 'Password123',
        confirmPassword: 'Password123',
        rememberMe: true,
      };

      const result = signupSchema.safeParse(validSignup);
      expect(result.success).to.be.true;
    });

    it('should reject signup with non-matching passwords', () => {
      const invalidSignup = {
        email: 'user@example.com',
        password: 'Password123',
        confirmPassword: 'DifferentPass123',
        rememberMe: false,
      };

      const result = signupSchema.safeParse(invalidSignup);
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.issues[0].message).to.include("don't match");
      }
    });

    it('should reject signup with invalid email', () => {
      const invalidSignup = {
        email: 'invalid',
        password: 'Password123',
        confirmPassword: 'Password123',
        rememberMe: false,
      };

      const result = signupSchema.safeParse(invalidSignup);
      expect(result.success).to.be.false;
    });

    it('should reject signup with weak password', () => {
      const invalidSignup = {
        email: 'user@example.com',
        password: 'weak',
        confirmPassword: 'weak',
        rememberMe: false,
      };

      const result = signupSchema.safeParse(invalidSignup);
      expect(result.success).to.be.false;
    });

    it('should have error on confirmPassword field when passwords do not match', () => {
      const invalidSignup = {
        email: 'user@example.com',
        password: 'Password123',
        confirmPassword: 'Different123',
        rememberMe: false,
      };

      const result = signupSchema.safeParse(invalidSignup);
      expect(result.success).to.be.false;
      if (!result.success) {
        const confirmPasswordError = result.error.issues.find(
          issue => issue.path.includes('confirmPassword')
        );
        expect(confirmPasswordError).to.exist;
      }
    });
  });

  describe('passwordResetRequestSchema', () => {
    it('should validate correct email for password reset', () => {
      const validRequest = {
        email: 'user@example.com',
      };

      const result = passwordResetRequestSchema.safeParse(validRequest);
      expect(result.success).to.be.true;
    });

    it('should reject invalid email', () => {
      const invalidRequest = {
        email: 'not-an-email',
      };

      const result = passwordResetRequestSchema.safeParse(invalidRequest);
      expect(result.success).to.be.false;
    });

    it('should reject empty email', () => {
      const invalidRequest = {
        email: '',
      };

      const result = passwordResetRequestSchema.safeParse(invalidRequest);
      expect(result.success).to.be.false;
    });
  });

  describe('passwordResetConfirmSchema', () => {
    it('should validate matching passwords', () => {
      const validReset = {
        password: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      };

      const result = passwordResetConfirmSchema.safeParse(validReset);
      expect(result.success).to.be.true;
    });

    it('should reject non-matching passwords', () => {
      const invalidReset = {
        password: 'NewPassword123',
        confirmPassword: 'DifferentPassword123',
      };

      const result = passwordResetConfirmSchema.safeParse(invalidReset);
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.issues[0].message).to.include("don't match");
      }
    });

    it('should reject weak passwords', () => {
      const invalidReset = {
        password: 'weak',
        confirmPassword: 'weak',
      };

      const result = passwordResetConfirmSchema.safeParse(invalidReset);
      expect(result.success).to.be.false;
    });
  });

  describe('passwordChangeSchema', () => {
    it('should validate correct password change data', () => {
      const validChange = {
        currentPassword: 'anything',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      };

      const result = passwordChangeSchema.safeParse(validChange);
      expect(result.success).to.be.true;
    });

    it('should reject when new passwords do not match', () => {
      const invalidChange = {
        currentPassword: 'OldPassword123',
        newPassword: 'NewPassword123',
        confirmPassword: 'DifferentPassword123',
      };

      const result = passwordChangeSchema.safeParse(invalidChange);
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.issues[0].message).to.include("don't match");
      }
    });

    it('should require current password', () => {
      const invalidChange = {
        currentPassword: '',
        newPassword: 'NewPassword123',
        confirmPassword: 'NewPassword123',
      };

      const result = passwordChangeSchema.safeParse(invalidChange);
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.issues[0].message).to.include('Current password is required');
      }
    });

    it('should reject weak new password', () => {
      const invalidChange = {
        currentPassword: 'OldPassword123',
        newPassword: 'weak',
        confirmPassword: 'weak',
      };

      const result = passwordChangeSchema.safeParse(invalidChange);
      expect(result.success).to.be.false;
    });
  });

  describe('reminderFormSchema', () => {
    it('should validate correct reminder data', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 2); // Use 2 hours to account for timezone differences
      const futureDateStr = futureDate.toISOString().slice(0, 16);

      const validReminder = {
        title: 'Test Reminder',
        message: 'This is a test message',
        phone_number: '+12025551234',
        date_time: futureDateStr,
        timezone: 'America/New_York',
      };

      const result = reminderFormSchema.safeParse(validReminder);
      if (!result.success) {
        console.log('Validation errors:', result.error.issues);
      }
      expect(result.success).to.be.true;
    });

    it('should reject empty title', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      const invalidReminder = {
        title: '',
        message: 'Test message',
        phone_number: '+12025551234',
        date_time: futureDate.toISOString().slice(0, 16),
        timezone: 'America/New_York',
      };

      const result = reminderFormSchema.safeParse(invalidReminder);
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.issues[0].message).to.include('Title is required');
      }
    });

    it('should reject title longer than 100 characters', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      const invalidReminder = {
        title: 'a'.repeat(101),
        message: 'Test message',
        phone_number: '+12025551234',
        date_time: futureDate.toISOString().slice(0, 16),
        timezone: 'America/New_York',
      };

      const result = reminderFormSchema.safeParse(invalidReminder);
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.issues[0].message).to.include('100 characters');
      }
    });

    it('should reject empty message', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      const invalidReminder = {
        title: 'Test Title',
        message: '',
        phone_number: '+12025551234',
        date_time: futureDate.toISOString().slice(0, 16),
        timezone: 'America/New_York',
      };

      const result = reminderFormSchema.safeParse(invalidReminder);
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.issues[0].message).to.include('Message is required');
      }
    });

    it('should reject message longer than 500 characters', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      const invalidReminder = {
        title: 'Test Title',
        message: 'a'.repeat(501),
        phone_number: '+12025551234',
        date_time: futureDate.toISOString().slice(0, 16),
        timezone: 'America/New_York',
      };

      const result = reminderFormSchema.safeParse(invalidReminder);
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.issues[0].message).to.include('500 characters');
      }
    });

    it('should reject invalid phone number', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 1);

      const invalidReminder = {
        title: 'Test Title',
        message: 'Test message',
        phone_number: '123',
        date_time: futureDate.toISOString().slice(0, 16),
        timezone: 'America/New_York',
      };

      const result = reminderFormSchema.safeParse(invalidReminder);
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.issues[0].message).to.include('valid phone number');
      }
    });

    it('should reject past date_time', () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 1);

      const invalidReminder = {
        title: 'Test Title',
        message: 'Test message',
        phone_number: '+12025551234',
        date_time: pastDate.toISOString().slice(0, 16),
        timezone: 'America/New_York',
      };

      const result = reminderFormSchema.safeParse(invalidReminder);
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.issues[0].message).to.include('future');
      }
    });

    it('should require timezone', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 2); // Use 2 hours to account for timezone differences

      const invalidReminder = {
        title: 'Test Title',
        message: 'Test message',
        phone_number: '+12025551234',
        date_time: futureDate.toISOString().slice(0, 16),
        timezone: '',
      };

      const result = reminderFormSchema.safeParse(invalidReminder);
      expect(result.success).to.be.false;
      if (!result.success) {
        expect(result.error.issues[0].message).to.include('Timezone is required');
      }
    });

    it('should accept valid international phone numbers', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 2); // Use 2 hours to account for timezone differences

      const internationalNumbers = [
        '+442079460958', // UK
        '+33142868200', // France
        '+81312345678', // Japan
        '+61212345678', // Australia
      ];

      internationalNumbers.forEach(phoneNumber => {
        const reminder = {
          title: 'Test Title',
          message: 'Test message',
          phone_number: phoneNumber,
          date_time: futureDate.toISOString().slice(0, 16),
          timezone: 'UTC',
        };

        const result = reminderFormSchema.safeParse(reminder);
        if (!result.success) {
          console.log(`Validation errors for ${phoneNumber}:`, result.error.issues);
        }
        expect(result.success, `Should accept phone: ${phoneNumber}`).to.be.true;
      });
    });
  });

  describe('Schema Integration Tests', () => {
    it('should use consistent email validation across schemas', () => {
      const email = 'test@example.com';

      const loginResult = loginSchema.safeParse({
        email,
        password: 'Password123',
        rememberMe: false,
      });

      const signupResult = signupSchema.safeParse({
        email,
        password: 'Password123',
        confirmPassword: 'Password123',
        rememberMe: false,
      });

      const resetResult = passwordResetRequestSchema.safeParse({ email });

      expect(loginResult.success).to.be.true;
      expect(signupResult.success).to.be.true;
      expect(resetResult.success).to.be.true;
    });

    it('should use consistent password validation across schemas', () => {
      const password = 'ValidPass123';

      const loginResult = loginSchema.safeParse({
        email: 'test@example.com',
        password,
        rememberMe: false,
      });

      const signupResult = signupSchema.safeParse({
        email: 'test@example.com',
        password,
        confirmPassword: password,
        rememberMe: false,
      });

      const resetResult = passwordResetConfirmSchema.safeParse({
        password,
        confirmPassword: password,
      });

      expect(loginResult.success).to.be.true;
      expect(signupResult.success).to.be.true;
      expect(resetResult.success).to.be.true;
    });
  });
});
