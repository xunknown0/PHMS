document.addEventListener("DOMContentLoaded", () => {
  // Show toasts
  document.querySelectorAll('.toast').forEach(toastEl => {
    new bootstrap.Toast(toastEl, { delay: 4000 }).show();
  });

  // Form validation
  const form = document.querySelector('.needs-validation');
  const passwordField = document.getElementById('password');
  const confirmPasswordField = document.getElementById('confirmPassword');
  const confirmFeedback = document.getElementById('confirm-password-feedback');

  const validatePasswords = () => {
    if (passwordField.value && confirmPasswordField.value) {
      if (passwordField.value !== confirmPasswordField.value) {
        confirmPasswordField.setCustomValidity('Passwords must match.');
        confirmFeedback.textContent = 'Passwords do not match.';
      } else {
        confirmPasswordField.setCustomValidity('');
        confirmFeedback.textContent = 'Please confirm your password.';
      }
    } else {
      confirmPasswordField.setCustomValidity('');
    }
  };

  form.addEventListener('submit', e => {
    validatePasswords();
    if (!form.checkValidity()) {
      e.preventDefault();
      e.stopPropagation();
    }
    form.classList.add('was-validated');
  });

  passwordField.addEventListener('input', validatePasswords);
  confirmPasswordField.addEventListener('input', validatePasswords);
});