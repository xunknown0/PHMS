    document.addEventListener("DOMContentLoaded", () => {
      // Initialize toasts
      document.querySelectorAll('.toast').forEach(toastEl => {
        new bootstrap.Toast(toastEl, { delay: 4000 }).show();
      });

      // Form validation
      const form = document.querySelector('.needs-validation');
      form.addEventListener('submit', e => {
        if (!form.checkValidity()) {
          e.preventDefault();
          e.stopPropagation();
        }
        form.classList.add('was-validated');
      });
    });

  
  const toastEl = document.getElementById("logoutToast");
  if (toastEl) {
    const toast = new bootstrap.Toast(toastEl);
    toast.show();
  }

