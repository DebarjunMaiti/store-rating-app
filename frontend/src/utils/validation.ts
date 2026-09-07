export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (!password || password.length < 8 || password.length > 16) {
    return { isValid: false, message: 'Password must be 8–16 characters long.' };
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
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  // Name: Min 8, Max 60 characters (Updated to 8 min)
  if (!data.name || data.name.trim().length < 8 || data.name.trim().length > 60) {
    errors.name = 'Name must be between 8 and 60 characters.';
  }

  // Email validation
  if (!data.email || !validateEmail(data.email.trim())) {
    errors.email = 'Please provide a valid email address.';
  }

  // Address: Max 400 characters
  if (!data.address || data.address.trim().length === 0) {
    errors.address = 'Address is required.';
  } else if (data.address.trim().length > 400) {
    errors.address = 'Address must not exceed 400 characters.';
  }

  // Password validation
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
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  if (!data.name || data.name.trim().length < 8 || data.name.trim().length > 60) {
    errors.name = 'Store name must be between 8 and 60 characters.';
  }

  if (!data.email || !validateEmail(data.email.trim())) {
    errors.email = 'Please enter a valid store email address.';
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