export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (!password || password.length < 8 || password.length > 16) {
    return { isValid: false, message: 'Password must be between 8 and 16 characters long.' };
  }
  const hasUpperCase = /[A-Z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/`~]/.test(password);

  if (!hasUpperCase) {
    return { isValid: false, message: 'Password must include at least one uppercase letter.' };
  }
  if (!hasSpecialChar) {
    return { isValid: false, message: 'Password must include at least one special character.' };
  }
  return { isValid: true };
};

export const validateUserForm = (data: {
  name?: string;
  email?: string;
  password?: string;
  address?: string;
  isPasswordRequired?: boolean;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  // Name validation: Min 8, Max 60 characters (Updated from 20 to 8)
  if (!data.name || data.name.trim().length < 8 || data.name.trim().length > 60) {
    errors.name = 'Name must be between 8 and 60 characters.';
  }

  // Email validation: Standard email validation
  if (!data.email || !validateEmail(data.email.trim())) {
    errors.email = 'Please provide a valid email address.';
  }

  // Address validation: Max 400 characters
  if (!data.address || data.address.trim().length === 0) {
    errors.address = 'Address is required.';
  } else if (data.address.trim().length > 400) {
    errors.address = 'Address must not exceed 400 characters.';
  }

  // Password validation (if required)
  if (data.isPasswordRequired !== false) {
    if (!data.password) {
      errors.password = 'Password is required.';
    } else {
      const pwdVal = validatePassword(data.password);
      if (!pwdVal.isValid) {
        errors.password = pwdVal.message || 'Invalid password.';
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateStoreForm = (data: {
  name?: string;
  email?: string;
  address?: string;
}): ValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.name || data.name.trim().length < 8 || data.name.trim().length > 60) {
    errors.name = 'Store name must be between 8 and 60 characters.';
  }

  if (!data.email || !validateEmail(data.email.trim())) {
    errors.email = 'Please provide a valid store email address.';
  }

  if (!data.address || data.address.trim().length === 0) {
    errors.address = 'Store address is required.';
  } else if (data.address.trim().length > 400) {
    errors.address = 'Store address must not exceed 400 characters.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};