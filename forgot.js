document.addEventListener('DOMContentLoaded', () => {
  const forgotForm = document.getElementById('forgotForm');

  if (forgotForm) {
    forgotForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailInput = document.getElementById('forgotEmail');
      const email = emailInput.value.trim();
      const submitBtn = forgotForm.querySelector('button[type="submit"]');

      if (!email) {
        alert('Email wajib diisi.');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Mengirim...';

    
      const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset.html',
      });

      submitBtn.disabled = false;
      submitBtn.textContent = 'Kirim Link';

      if (error) {
        alert('Gagal ngirim link: ' + error.message);
        console.error(error);
        return;
      }

      alert('Link reset password sudah dikirim, cek email.');
      emailInput.value = '';
    });
  }
});