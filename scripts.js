/* ============================================
   SLIDESHOW HERO
============================================ */

document.addEventListener('DOMContentLoaded', async function () {
  const track = document.getElementById('slidesTrack');
  const btnPrev = document.getElementById('slidePrev');
  const btnNext = document.getElementById('slideNext');

  if (!track || !btnPrev || !btnNext) {
    console.warn('Slideshow: elemen track/tombol tidak ditemukan', {
      track,
      btnPrev,
      btnNext
    });
    return;
  }

  async function renderFeaturedSlides() {
    const { data: featuredPosts, error } = await supabaseClient
      .from('posts')
      .select(`
        *,
        profiles (
          username
        )
      `)
      .eq('status', 'approved')
      .eq('is_featured', true)
      .order('approved_at', { ascending: false });

    if (error) {
      console.error('Gagal mengambil featured posts:', error);
      return;
    }

    if (!featuredPosts || featuredPosts.length === 0) {
      return;
    }

    const hiddenClones = track.querySelectorAll('.slide[aria-hidden="true"]');
    const firstHiddenClone = hiddenClones[0] || null;

    featuredPosts.forEach((post) => {
      const alreadyExists = track.querySelector(
        `.featured-slide[data-featured-id="${post.id}"]`
      );

      if (alreadyExists) return;

      const slide = document.createElement('div');
      slide.className = 'slide featured-slide';
      slide.dataset.featuredId = post.id;

      const username = post.profiles?.username || 'User';

      slide.innerHTML = `
        <img src="${post.image_url}" alt="Featured karya ${username}">

        <div class="featured-slide-info">
          <span>${post.category}</span>
          <h2>${username}</h2>
          <p>${post.description || ''}</p>
        </div>
      `;

      if (firstHiddenClone) {
        track.insertBefore(slide, firstHiddenClone);
      } else {
        track.appendChild(slide);
      }
    });
  }

  await renderFeaturedSlides();

  const allSlides = Array.from(track.querySelectorAll('.slide'));

  const slides = allSlides.filter((slide) => {
    return slide.getAttribute('aria-hidden') !== 'true';
  });

  if (slides.length === 0) {
    console.warn('Slideshow: tidak ada slide asli di dalam #slidesTrack');
    return;
  }

  let current = 0;
  let autoTimer = null;

  const INTERVAL = 3000;
  const RESET_WAIT = 5000;

  function updateActiveSlide() {
    allSlides.forEach((slide) => {
      slide.classList.remove('active');
    });

    slides[current].classList.add('active');
  }

  function goTo(index, animate = true) {
    if (index < 0) {
      current = slides.length - 1;
    } else if (index >= slides.length) {
      current = 0;
    } else {
      current = index;
    }

    const viewport = track.parentElement;
    const targetSlide = slides[current];

    const offset =
      targetSlide.offsetLeft -
      (viewport.clientWidth - targetSlide.offsetWidth) / 2;

    track.style.transition = animate
      ? 'transform .65s cubic-bezier(.4,0,.2,1)'
      : 'none';

    track.style.transform = `translate3d(-${offset}px, 0, 0)`;

    updateActiveSlide();
  }

  function next() {
    goTo(current + 1);
  }

  function prev() {
    goTo(current - 1);
  }

  function startAuto() {
    stopAuto();

    if (slides.length <= 1) return;

    autoTimer = setInterval(next, INTERVAL);
  }

  function stopAuto() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  goTo(0, false);
  startAuto();

  btnNext.addEventListener('click', () => {
    stopAuto();
    next();
    setTimeout(startAuto, RESET_WAIT);
  });

  btnPrev.addEventListener('click', () => {
    stopAuto();
    prev();
    setTimeout(startAuto, RESET_WAIT);
  });

  document.addEventListener('visibilitychange', () => {
    document.hidden ? stopAuto() : startAuto();
  });

  window.addEventListener('resize', () => {
    goTo(current, false);
  });
});


/* ============================================
   GALERI — drag-to-scroll (desktop)
   ============================================ */
(function () {
  const swipe = document.querySelector('.galeri-swipe');
  if (!swipe) return;
 
  let isDown    = false;
  let startX    = 0;
  let scrollLeft = 0;
 
  swipe.addEventListener('mousedown', (e) => {
    isDown = true;
    swipe.classList.add('dragging');
    startX     = e.pageX - swipe.offsetLeft;
    scrollLeft = swipe.scrollLeft;
  });
 
  swipe.addEventListener('mouseleave', () => { isDown = false; swipe.classList.remove('dragging'); });
  swipe.addEventListener('mouseup',    () => { isDown = false; swipe.classList.remove('dragging'); });
 
  swipe.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x    = e.pageX - swipe.offsetLeft;
    const walk = (x - startX) * 1.2;
    swipe.scrollLeft = scrollLeft - walk;
  });
})();
 

/* ============================================
   NAV AUTH STATUS
============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const navAuth = document.getElementById('navAuth');

  if (!navAuth) return;

  const currentUser =
    JSON.parse(localStorage.getItem('xdkv3_currentUser'));

  if (!currentUser) {
   navAuth.innerHTML = `
  <a href="login.html" class="login-chip">
    <span>Login untuk upload</span>
  </a>
`;
    return;
  }

  navAuth.innerHTML = `
    <a href="profile.html" class="profile-chip">
      <img
        src="${currentUser.avatar || 'images/pp-01.png'}"
        alt="Profile"
      >

      <span>${currentUser.username}</span>
    </a>
  `;
});

/* ============================================
   LOGIN TOAST REMINDER
============================================ */

document.addEventListener('DOMContentLoaded', () => {
  const toast = document.getElementById('loginToast');
  const closeBtn = document.getElementById('closeLoginToast');

  if (!toast) return;

  const currentUser = JSON.parse(localStorage.getItem('xdkv3_currentUser'));
  const toastClosed = sessionStorage.getItem('xdkv3_loginToastClosed');
  

  // Kalau user sudah login, notif tidak muncul
  if (currentUser) return;

  // Kalau user sudah nutup notif di sesi ini, jangan muncul lagi
  if (toastClosed === 'true') return;

  setTimeout(() => {
    toast.classList.add('show');
  }, 1200);


  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      toast.classList.remove('show');
      sessionStorage.setItem('xdkv3_loginToastClosed', 'true');
    });
  }
});










/*supabase */

/* ============================================
   RENDER APPROVED POSTS FROM SUPABASE
============================================ */

document.addEventListener('DOMContentLoaded', async () => {
  const karyaScroll =
    document.getElementById('karyaScroll') ||
    document.querySelector('.karya-scroll');

  if (!karyaScroll) {
    console.warn('Elemen karyaScroll / .karya-scroll tidak ditemukan.');
    return;
  }

  function formatDate(dateString) {
    if (!dateString) return '';

    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  async function getApprovedPosts() {
    const { data, error } = await supabaseClient
      .from('posts')
      .select(`
        *,
        profiles (
          username,
          avatar_url
        )
      `)
      .eq('status', 'approved')
      .order('approved_at', { ascending: false });

    if (error) {
      console.error('Gagal mengambil approved posts:', error);
      return [];
    }

    return data || [];
  }

  async function renderApprovedPosts() {
    const posts = await getApprovedPosts();

    karyaScroll.innerHTML = '';

    if (posts.length === 0) {
      karyaScroll.innerHTML = `
        <div class="empty-karya">
          <h3>Belum ada karya yang tampil.</h3>
          <p>Karya akan muncul setelah admin approve postingan.</p>
        </div>
      `;
      return;
    }

    posts.forEach((post) => {
      const card = document.createElement('article');
      card.className = 'karya-card';

      const username = post.profiles?.username || 'User';
      const avatar = post.profiles?.avatar_url || 'images/pp-01.png';

      const imageClass =
        post.aspect_mode === 'original'
          ? 'aspect-original'
          : 'aspect-square';

      card.innerHTML = `
        <span class="kategori">
          ${post.category}
        </span>

        <div class="karya-image ${imageClass}">
          <img src="${post.image_url}" alt="Karya dari ${username}">
        </div>

        <a href="profile.html?userId=${post.user_id}" class="creator creator-link">

          <img class="creator-pp"
            src="${avatar}"
            alt="Profile">

          <div class="creator-info">
            <div class="creator-topline">
              <h4>${username}</h4>

              <span class="post-type-label">
                ${post.post_type}
              </span>
            </div>

            <p>
              ${post.description || ''}
            </p>

            <span class="tanggal">
              ${formatDate(post.approved_at || post.created_at)}
            </span>
          </div>

        </a>
      `;

      karyaScroll.appendChild(card);
    });
  }

  renderApprovedPosts();
});