document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');

  function getInput(...ids) {
    for (const id of ids) {
      const input = document.getElementById(id);
      if (input) return input;
    }

    return null;
  }

  async function getProfile(userId) {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn('Gagal ambil profile:', error.message);
      return null;
    }

    return data;
  }

  function saveCurrentUser(profile, authUser) {
    const currentUser = {
      id: authUser.id,
      email: authUser.email,
      username: profile?.username || authUser.user_metadata?.username || 'User',
      avatar: profile?.avatar_url || 'images/pp-01.png',
      bio: profile?.bio || '',
      instagram: profile?.instagram || '',
      role: profile?.role || 'user'
    };

    localStorage.setItem('xdkv3_currentUser', JSON.stringify(currentUser));
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (event) => {
      event.preventDefault();

      const usernameInput = getInput('registerUsername', 'username');
const emailInput = getInput('registerEmail', 'email');
const passwordInput = getInput('registerPassword', 'password');
const confirmPasswordInput = getInput('registerConfirmPassword', 'confirmPassword');

const username = usernameInput ? usernameInput.value.trim() : '';
const email = emailInput ? emailInput.value.trim() : '';
const password = passwordInput ? passwordInput.value.trim() : '';
const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value.trim() : '';

      if (!username || !email || !password || !confirmPassword) {
        alert('Username, email, dan password wajib diisi.');
        return;
      }
      if (password !== confirmPassword) {
  alert('Password dan verify password tidak sama.');
  return;
}

      if (password.length < 6) {
        alert('Password minimal 6 karakter.');
        return;
      }

      const submitBtn = registerForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Mendaftarkan...';
      }

      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            username
          }
        }
      });

      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Register';
      }

      if (error) {
        alert(error.message);
        console.error(error);
        return;
      }

      if (!data.session) {
        alert('Akun berhasil dibuat. Cek email untuk verifikasi sebelum login.');
        window.location.href = 'login.html';
        return;
      }

      const profile = await getProfile(data.user.id);
      saveCurrentUser(profile, data.user);

      alert('Akun berhasil dibuat.');
      window.location.href = 'index.html';
    });
  }

if (loginForm) {
  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const emailInput = getInput('loginEmail', 'email');
    const passwordInput = getInput('loginPassword', 'password');

    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value.trim() : '';

    if (!email || !password) {
      alert('Email dan password wajib diisi.');
      return;
    }

    const submitBtn = loginForm.querySelector('button[type="submit"]');

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Login...';
    }

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Login';
    }

    if (error) {
      alert(error.message);
      console.error('LOGIN ERROR:', error);
      return;
    }

    console.log('LOGIN DATA:', data);

    if (!data.session) {
      alert('Login berhasil tapi session belum terbaca. Cek setting email confirmation atau Supabase client.');
      return;
    }

    const profile = await getProfile(data.user.id);
    saveCurrentUser(profile, data.user);

    alert('Login berhasil.');
    window.location.href = 'index.html';
  });
}
});