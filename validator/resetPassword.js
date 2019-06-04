const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = function validateResetPasswordInput(data) {
  let errors = {};

  data.password = !isEmpty(data.password) ? data.password : '';
  data.checkPassword = !isEmpty(data.checkPassword) ? data.checkPassword : '';

  if (Validator.isEmpty(data.password)) {
    errors.password = 'Password field is required';
  }

  if (!Validator.isLength(data.password, { min: 6, max: 30 })) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (Validator.isEmpty(data.checkPassword)) {
    errors.checkPassword = 'Check Password field is required';
  }

  if (!Validator.equals(data.password, data.checkPassword)) {
    errors.checkPassword = 'Passwords must match';
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};