/**
 * Validation utilities for Student credentials
 * Rule: Username and Password must contain at least 4 characters and at least one number.
 */

export interface CredentialValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validateUsername = (username: string): CredentialValidationResult => {
  const errors: string[] = [];
  const clean = (username || '').trim();

  if (!clean) {
    errors.push('Username is required.');
    return { isValid: false, errors };
  }

  if (clean.length < 4) {
    errors.push('Username must be at least 4 characters long.');
  }

  if (!/\d/.test(clean)) {
    errors.push('Username must contain at least one number (0-9).');
  }

  if (/\s/.test(clean)) {
    errors.push('Username cannot contain spaces.');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validatePassword = (password: string): CredentialValidationResult => {
  const errors: string[] = [];
  const clean = password || '';

  if (!clean) {
    errors.push('Password is required.');
    return { isValid: false, errors };
  }

  if (clean.length < 4) {
    errors.push('Password must be at least 4 characters long.');
  }

  if (!/\d/.test(clean)) {
    errors.push('Password must contain at least one number (0-9).');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const checkCredentialRules = (val: string): {
  hasMinLength: boolean;
  hasNumber: boolean;
  isValid: boolean;
} => {
  const str = val || '';
  const hasMinLength = str.length >= 4;
  const hasNumber = /\d/.test(str);
  return {
    hasMinLength,
    hasNumber,
    isValid: hasMinLength && hasNumber
  };
};

/**
 * Staff Username validation rules:
 * - Minimum 3 characters
 * - Alphanumeric with dots, underscores, hyphens
 * - Numbers are OPTIONAL (not mandatory, so standard names like 'aravindj' are fully valid)
 */
export const checkStaffUsernameRules = (val: string): {
  hasMinLength: boolean;
  isValidChar: boolean;
  hasNoSpaces: boolean;
  isValid: boolean;
} => {
  const str = (val || '').trim();
  const hasMinLength = str.length >= 3;
  const isValidChar = /^[a-zA-Z0-9._-]+$/.test(str);
  const hasNoSpaces = !/\s/.test(val || '');
  return {
    hasMinLength,
    isValidChar,
    hasNoSpaces,
    isValid: hasMinLength && isValidChar && hasNoSpaces
  };
};

/**
 * Staff Password validation rules:
 * - Minimum 4 characters
 */
export const checkStaffPasswordRules = (val: string): {
  hasMinLength: boolean;
  isValid: boolean;
} => {
  const str = val || '';
  const hasMinLength = str.length >= 4;
  return {
    hasMinLength,
    isValid: hasMinLength
  };
};

/**
 * Generates the default student password based on:
 * Date of Birth (DDMMYYYY) followed by the last 2 digits of the mobile number.
 * Example: Raju DOB: 14/04/2005, Mobile: 1234567890 -> 1404200590
 */
export const generateDefaultStudentPassword = (
  dateOfBirth?: string,
  mobileNumber?: string
): string => {
  if (!dateOfBirth || !mobileNumber) return '';

  // Extract digits from mobile number
  const cleanMob = mobileNumber.replace(/\D/g, '');
  if (cleanMob.length < 2) return '';
  const last2Digits = cleanMob.slice(-2);

  const cleanDob = dateOfBirth.trim();
  let day = '';
  let month = '';
  let year = '';

  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDob)) {
    // Format YYYY-MM-DD (standard HTML date input)
    const [y, m, d] = cleanDob.split('-');
    year = y;
    month = m.padStart(2, '0');
    day = d.padStart(2, '0');
  } else if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(cleanDob)) {
    // Format DD/MM/YYYY or DD-MM-YYYY
    const parts = cleanDob.split(/[/-]/);
    day = parts[0].padStart(2, '0');
    month = parts[1].padStart(2, '0');
    year = parts[2];
  } else {
    const d = new Date(cleanDob);
    if (!isNaN(d.getTime())) {
      day = d.getDate().toString().padStart(2, '0');
      month = (d.getMonth() + 1).toString().padStart(2, '0');
      year = d.getFullYear().toString();
    }
  }

  if (day && month && year && last2Digits.length === 2) {
    return `${day}${month}${year}${last2Digits}`;
  }

  return '';
};

/**
 * Formats date to YYYY-MM-DD for input[type="date"]
 */
export const formatDobForInput = (dateStr?: string): string => {
  if (!dateStr) return '';
  const clean = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(clean)) {
    const [d, m, y] = clean.split(/[/-]/);
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return clean;
};

/**
 * Formats date to DD/MM/YYYY for UI display
 */
export const formatDobForDisplay = (dateStr?: string): string => {
  if (!dateStr) return '';
  const clean = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    const [y, m, d] = clean.split('-');
    return `${d}/${m}/${y}`;
  }
  return clean;
};

