document.addEventListener('DOMContentLoaded', () => {
  const resetForm = document.getElementById('resetForm');

 
  supabaseClient.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      console.log('Mode recovery aktif, siap ganti password.');
    }
  });

  if (resetForm) {
    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const newPassword = document.getElementById('newPassword').value.trim();
      const confirmPassword = document.getElementById('confirmNewPassword').value.trim();
      const submitBtn = resetForm.querySelector('button[type="submit"]');

      if (newPassword !== confirmPassword) {
        alert('Password dan verifikasinya beda tuh.');
        return;
      }

      if (newPassword.length < 6) {
        alert('Password minimal 6 karakter.');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Nyimpen...';

    
      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword
      });

      submitBtn.disabled = false;
      submitBtn.textContent = 'Simpan';

      if (error) {
        alert('Gagal update password: ' + error.message);
        console.error(error);
        return;
      }

      alert('Password berhasil diganti! Login lagi pake password lu yang baru.');

      window.location.href = 'login.html';
    });
  }
});