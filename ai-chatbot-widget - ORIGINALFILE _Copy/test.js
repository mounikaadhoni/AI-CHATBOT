const fs = require('fs');
function checkPasswordRules(password) {
  return {
    length:  password.length >= 8,
    upper:   /[A-Z]/.test(password),
    lower:   /[a-z]/.test(password),
    number:  /[0-9]/.test(password),
    special: /[!@#\$%\^&\*\(\),\.\?\"\:\{\}\|\<\>_\-\+=\[\]\\\\\/~]/.test(password)
  };
}
console.log(checkPasswordRules('Abcdefg1!'));
console.log(checkPasswordRules('password'));
