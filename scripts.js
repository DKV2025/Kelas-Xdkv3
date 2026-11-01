document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  
  const triggerSection = document.querySelector('.hero-brand-bar');

  if (header && triggerSection) {
    window.addEventListener('scroll', () => {
      const scrollPos = window.scrollY;
      
      
      const triggerTop = triggerSection.offsetTop;

      
      if (scrollPos >= triggerTop - 50) {
        header.classList.add('is-sticky');
        document.body.style.paddingTop = header.offsetHeight + 'px';
      } 
      
      else if (scrollPos <= 10) {
        header.classList.remove('is-sticky');
        document.body.style.paddingTop = '0';
      }
    });
  }
});

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
      .order('approved_at', { ascending: false })
      .limit(5); // <-- REM KE-1: Mentok 5 karya

    if (error) {
      console.error('Gagal mengambil featured posts:', error);
      return;
    }

    if (!featuredPosts || featuredPosts.length === 0) {
      return;
    }
    
    const hiddenClones = track.querySelectorAll('.slide[aria-hidden="true"]');
    const firstHiddenClone = hiddenClones[0] || null;

    featuredPosts.forEach((post, index) => {
      const alreadyExists = track.querySelector(
        `.featured-slide[data-featured-id="${post.id}"]`
      );

      if (alreadyExists) return;

      const slide = document.createElement('div');
      slide.className = 'slide featured-slide';
      slide.dataset.featuredId = post.id;

      const username = escapeHTML(post.profiles?.username || 'User');
      const category = escapeHTML(post.category);
      const description = escapeHTML(post.description || '');
      const imageUrl = escapeHTML(post.image_url);

      // REM KE-2: Lazy load buat slide ke-2 dan ke-3. Slide pertama langsung diload biar ga blank.
      const lazyAttr = index === 0 ? '' : 'loading="lazy"';

      slide.innerHTML = `
        <div class="shimmer-effect"></div>
        <img 
          src="${imageUrl}" 
          alt="Featured karya ${username}" 
          ${lazyAttr}
          onload="this.classList.add('is-loaded'); this.previousElementSibling.style.display='none';"
        >

        <div class="featured-slide-info">
          <span>${category}</span>
          <h2>${username}</h2>
          <p>${description}</p>
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
   GALERI - drag-to-scroll (desktop)
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

document.addEventListener('DOMContentLoaded', async () => {
  const navAuth = document.getElementById('navAuth');

  if (!navAuth) return;

  const currentUser = JSON.parse(localStorage.getItem('xdkv3_currentUser'));

  async function hasUnreadMessages(userId) {
    const { count, error } = await supabaseClient
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .is('read_at', null);

    if (error) {
      console.error('Gagal cek unread messages:', error);
      return false;
    }

    return count > 0;
  }

  async function hasNewLikeActivities(userId) {
    const lastSeen =
      localStorage.getItem(`xdkv3_lastInboxSeen_${userId}`) ||
      '1970-01-01T00:00:00.000Z';

    const { count, error } = await supabaseClient
      .from('post_likes')
      .select(`
        id,
        posts!inner (
          user_id
        )
      `, { count: 'exact', head: true })
      .eq('posts.user_id', userId)
      .neq('user_id', userId)
      .gt('created_at', lastSeen);

    if (error) {
      console.error('Gagal cek aktivitas like baru:', error);
      return false;
    }

    return count > 0;
  }

  async function renderAdminShortcut() {
    const adminShortcutWrap = document.getElementById('adminShortcutWrap');

    if (!adminShortcutWrap) return;

    const { data: authData, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !authData.user) {
      adminShortcutWrap.classList.remove('is-visible');
      return;
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !profile) {
      adminShortcutWrap.classList.remove('is-visible');
      return;
    }

    if (profile.role === 'admin') {
      adminShortcutWrap.classList.add('is-visible');
    } else {
      adminShortcutWrap.classList.remove('is-visible');
    }
  }

  if (!currentUser) {
    navAuth.innerHTML = `
      <a href="login.html" class="login-chip">
        <span>Login untuk upload</span>
      </a>
    `;

    await renderAdminShortcut();
    return;
  }

  const unreadMessages = await hasUnreadMessages(currentUser.id);
  const newLikeActivities = await hasNewLikeActivities(currentUser.id);

  const unread = unreadMessages || newLikeActivities;

  navAuth.innerHTML = `
    <a
      href="inbox.html"
      class="nav-chat-btn ${unread ? 'has-unread' : ''}"
      title="Pesan"
      aria-label="Pesan"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
    </a>

    <a href="profile.html" class="profile-chip">
      <div class="img-loading-wrapper" style="width: 34px; height: 34px; border-radius: 50%;">
  <div class="shimmer-effect"></div>
  <img 
    src="${currentUser.avatar || 'images/pp-01.png'}" 
    alt="Profile"
    onload="this.classList.add('is-loaded'); this.previousElementSibling.style.display='none';"
  >
</div>
      <span>${currentUser.username}</span>
    </a>
  `;

  await renderAdminShortcut();
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

  if (currentUser) return;

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
  async function setupLikeButtons() {
  const likeButtons = document.querySelectorAll('.post-like-btn');

  if (!likeButtons.length) return;

  const { data: authData } = await supabaseClient.auth.getUser();
  const currentUser = authData?.user || null;

  const postIds = Array.from(likeButtons).map((button) => {
    return button.dataset.postId;
  });

  const { data: likes, error } = await supabaseClient
    .from('post_likes')
    .select('post_id, user_id')
    .in('post_id', postIds);

  if (error) {
    console.error('Gagal mengambil likes:', error);
    return;
  }

  const likeCountMap = new Map();
  const likedByMeSet = new Set();

  likes.forEach((like) => {
    likeCountMap.set(
      like.post_id,
      (likeCountMap.get(like.post_id) || 0) + 1
    );

    if (currentUser && like.user_id === currentUser.id) {
      likedByMeSet.add(like.post_id);
    }
  });

  likeButtons.forEach((button) => {
    const postId = button.dataset.postId;
    const countSpan = button.querySelector('.like-count');

    const count = likeCountMap.get(postId) || 0;

    if (countSpan) {
      countSpan.textContent = count;
    }

    if (likedByMeSet.has(postId)) {
      button.classList.add('is-liked');
    } else {
      button.classList.remove('is-liked');
    }

    button.addEventListener('click', async () => {
      if (!currentUser) {
        window.location.href = 'login.html';
        return;
      }

      button.disabled = true;

      const isLiked = button.classList.contains('is-liked');

      if (isLiked) {
        const { error: unlikeError } = await supabaseClient
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', currentUser.id);

        if (!unlikeError) {
          button.classList.remove('is-liked');
          const currentCount = Number(countSpan ? countSpan.textContent : 0);
          if (countSpan) countSpan.textContent = Math.max(0, currentCount - 1);
        }
      } else {
        const { error: likeError } = await supabaseClient
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: currentUser.id
          });

        if (!likeError) {
          button.classList.add('is-liked');
          const currentCount = Number(countSpan ? countSpan.textContent : 0);
          if (countSpan) countSpan.textContent = currentCount + 1;
        }
      }

      button.disabled = false;
    });
  });
}
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

  // ============================================
  // INFINITE SCROLL & RENDER POSTS (UPDATE VIP SHARE)
  // ============================================
  let currentCategory = 'Semua';
  let currentPage = 0;
  const POSTS_PER_PAGE = 9;
  let hasMorePosts = true;
  let isFetching = false;
  let sharedPostIdToSkip = null;

  
  const scrollTrigger = document.createElement('div');
  scrollTrigger.id = 'scroll-trigger';
  scrollTrigger.style.height = '1px';
  karyaScroll.parentNode.insertBefore(scrollTrigger, karyaScroll.nextSibling);

  function createKaryaCard(post) {
    const card = document.createElement('article');
    card.className = 'karya-card';

    const username = escapeHTML(post.profiles?.username || 'User');
    const avatar = escapeHTML(post.profiles?.avatar_url || 'images/pp-01.png');
    
    // Nambahin tangkepan data class_tag dari Supabase
    const classTag = post.profiles?.class_tag ? escapeHTML(post.profiles.class_tag) : '';

    const category = escapeHTML(post.category);
    const postType = escapeHTML(post.post_type);
    const description = escapeHTML(post.description || '');
    const imageUrl = escapeHTML(post.image_url);
    const postId = escapeHTML(post.id);

    const imageClass = post.aspect_mode === 'original' ? 'aspect-original' : 'aspect-square';

    card.innerHTML = `
      <span class="kategori">${category}</span>
      <div class="karya-image ${imageClass}">
        <div class="shimmer-effect"></div>
        <img 
          src="${imageUrl}" 
          alt="Karya dari ${username}" 
          loading="lazy"
          onload="this.classList.add('is-loaded'); this.previousElementSibling.style.display='none';"
        >
      </div>
      <div class="creator">
        <a href="profile.html?userId=${post.user_id}" class="creator-avatar-link">
          <img class="creator-pp" src="${avatar}" alt="Profile">
        </a>
        <div class="creator-info">
          <a href="profile.html?userId=${post.user_id}" class="creator-name-link">
            <!-- INI BAGIAN YANG DITAMBAHIN BADGE KELASNYA -->
            <h4>${username} ${classTag ? `<span class="class-badge">${classTag}</span>` : ''}</h4>
          </a>
          <span class="post-type-label">${postType}</span>
          <p>${description}</p>
          <div class="post-bottom-row">
            <span class="tanggal">${formatDate(post.approved_at || post.created_at)}</span>
            <div class="post-actions">
              <button type="button" class="post-like-btn" data-post-id="${postId}" aria-label="Suka karya">
                <svg class="post-like-icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                <span class="like-count" data-like-count="${postId}">0</span>
              </button>
              <a href="chat.html?userId=${post.user_id}&postId=${postId}" class="post-chat-btn" title="Kirim pesan" aria-label="Kirim pesan">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
              </a>
              <button type="button" class="post-share-btn" data-post-id="${postId}" aria-label="Bagikan karya" title="Bagikan karya">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
    return card;
  }

 
  async function fetchAndRenderPosts(isReset = false) {
    if (isFetching) return;
    
    if (isReset) {
      currentPage = 0;
      
      if (!sharedPostIdToSkip) {
        karyaScroll.innerHTML = '';
      }
      hasMorePosts = true;
    }

    if (!hasMorePosts) return;
    let loadingSpinner = document.getElementById('scroll-spinner');
    if (!loadingSpinner) {
      loadingSpinner = document.createElement('div');
      loadingSpinner.id = 'scroll-spinner';
      loadingSpinner.innerHTML = '<div style="text-align:center; padding:20px; font-weight:600; color:#5b6b84;">Sedang memuat karya...</div>';
      karyaScroll.parentNode.insertBefore(loadingSpinner, scrollTrigger);
    }
    loadingSpinner.style.display = 'block'; // Munculin spinner
    isFetching = true;

    let query = supabaseClient
      .from('posts')
      .select('*, profiles (username, avatar_url, class_tag)', { count: 'exact' })
      .eq('status', 'approved');

    if (currentCategory !== 'Semua') {
      query = query.eq('category', currentCategory);
    }

    
    if (sharedPostIdToSkip) {
      query = query.neq('id', sharedPostIdToSkip);
    }

    const from = currentPage * POSTS_PER_PAGE;
    const to = from + POSTS_PER_PAGE - 1;
    query = query.range(from, to).order('approved_at', { ascending: false });

    const { data, count, error } = await query;

    if (error) {
      console.error('Gagal mengambil posts:', error);
      isFetching = false;
      return;
    }

    if (isReset && (!data || data.length === 0) && !sharedPostIdToSkip) {
      karyaScroll.innerHTML = `
        <div class="empty-karya" style="text-align:center; padding: 40px; width: 100%;">
          <h3>Belum ada karya di kategori ini.</h3>
        </div>
      `;
      isFetching = false;
      return;
    }

  
    data.forEach((post) => {
      const card = createKaryaCard(post);
      karyaScroll.appendChild(card);
    });

   
    await setupLikeButtons();

    if (to >= count - 1 || data.length < POSTS_PER_PAGE) {
      hasMorePosts = false;
    }

    if (loadingSpinner) {
      loadingSpinner.style.display = 'none'; // Sembunyikan spinner
    }

    currentPage++;
    isFetching = false;
  }

  
  async function initGallery() {
    const urlParams = new URLSearchParams(window.location.search);
    const targetPostId = urlParams.get('post');

    if (targetPostId) {
      
      sharedPostIdToSkip = targetPostId;

      
      const { data: sharedPost, error } = await supabaseClient
        .from('posts')
        .select('*, profiles (username, avatar_url, class_tag)')
        .eq('id', targetPostId)
        .single();

      if (sharedPost && !error) {
        karyaScroll.innerHTML = '';
        const card = createKaryaCard(sharedPost);
        karyaScroll.appendChild(card);

        
        setTimeout(() => {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.style.transition = 'box-shadow 0.4s ease';
          card.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.6)';
          setTimeout(() => { card.style.boxShadow = ''; }, 3000);
        }, 800);

        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
        
      } else {
        
        sharedPostIdToSkip = null; 
      }
    }

   
    await fetchAndRenderPosts(true);
  }

 
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasMorePosts && !isFetching) {
      fetchAndRenderPosts(false);
    }
  }, { rootMargin: '200px' });
  observer.observe(scrollTrigger);

  
  const bar = document.getElementById('filterBar');
  const toggle = document.getElementById('filterToggle');
  const chips = document.querySelectorAll('.chip');

  if (toggle && bar) {
    toggle.addEventListener('click', () => {
      const isOpen = bar.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    chips.forEach(chip => {
      chip.addEventListener('click', async () => {
        chips.forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        
        currentCategory = chip.getAttribute('data-cat');
        
       
        sharedPostIdToSkip = null; 
        
        await fetchAndRenderPosts(true); 
      });
    });
  }
  initGallery();

  // ============================================
  // LOGIC MODAL BAGIKAN KARYA (SHARE MODAL)
  // ============================================

  // Helper Notifikasi Toast Share
  function showShareToast(message) {
    let toast = document.getElementById('shareNotificationToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'shareNotificationToast';
      toast.className = 'share-notification-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 3200);
  }

  let activeSharePost = {
    id: '',
    shareUrl: '',
    imageUrl: '',
    authorName: '',
    category: '',
    description: ''
  };

  const shareModal = document.getElementById('shareModal');
  const shareModalBackdrop = document.getElementById('shareModalBackdrop');
  const shareModalClose = document.getElementById('shareModalClose');
  const shareModalThumb = document.getElementById('shareModalThumb');
  const shareModalCategory = document.getElementById('shareModalCategory');
  const shareModalAuthor = document.getElementById('shareModalAuthor');
  const shareModalDesc = document.getElementById('shareModalDesc');
  const shareOptCopyUrlText = document.getElementById('shareOptCopyUrlText');
  const shareOptCopyBadge = document.getElementById('shareOptCopyBadge');

  const shareOptIgStory = document.getElementById('shareOptIgStory');
  const shareOptWhatsApp = document.getElementById('shareOptWhatsApp');
  const shareOptCopy = document.getElementById('shareOptCopy');
  const shareOptNative = document.getElementById('shareOptNative');

  function openShareModal(postData) {
    if (!shareModal) return;
    activeSharePost = {
      id: postData.id || '',
      shareUrl: postData.shareUrl || `https://dkv-share.vercel.app/api?post=${postData.id}`,
      imageUrl: postData.imageUrl || '',
      authorName: postData.authorName || 'Siswa DKV',
      category: postData.category || 'Karya Siswa',
      description: postData.description || 'Karya portofolio digital XI DKV SMKN 1 Tasikmalaya.'
    };

    if (shareModalThumb) {
      shareModalThumb.src = activeSharePost.imageUrl || 'assets/logo.png';
      shareModalThumb.alt = `Karya ${activeSharePost.authorName}`;
    }
    if (shareModalCategory) {
      shareModalCategory.textContent = activeSharePost.category;
    }
    if (shareModalAuthor) {
      shareModalAuthor.textContent = `Karya ${activeSharePost.authorName}`;
    }
    if (shareModalDesc) {
      shareModalDesc.textContent = activeSharePost.description;
    }
    if (shareOptCopyUrlText) {
      shareOptCopyUrlText.textContent = activeSharePost.shareUrl.replace(/^https?:\/\//, '');
    }
    if (shareOptCopyBadge) {
      shareOptCopyBadge.textContent = 'Salin';
      shareOptCopyBadge.classList.remove('copied');
    }

    shareModal.classList.add('is-open');
    shareModal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('share-modal-active');
  }

  function closeShareModal() {
    if (!shareModal) return;
    shareModal.classList.remove('is-open');
    shareModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('share-modal-active');
  }

  if (shareModalClose) shareModalClose.addEventListener('click', closeShareModal);
  if (shareModalBackdrop) shareModalBackdrop.addEventListener('click', closeShareModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && shareModal && shareModal.classList.contains('is-open')) {
      closeShareModal();
    }
  });

  // 1. OPSI INSTAGRAM STORY
  if (shareOptIgStory) {
    shareOptIgStory.addEventListener('click', async () => {
      const shareUrl = activeSharePost.shareUrl;
      const imageUrl = activeSharePost.imageUrl;
      const authorName = activeSharePost.authorName;

      // Otomatis salin URL karya ke clipboard agar user tinggal tempel di Stiker Tautan Story
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(shareUrl);
        }
      } catch (_) {}

      // Unduh file gambar agar siap di galeri perangkat
      if (imageUrl && !imageUrl.startsWith('data:')) {
        try {
          const a = document.createElement('a');
          a.href = imageUrl;
          a.download = `karya-${activeSharePost.id || 'dkv'}.jpg`;
          a.target = '_blank';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } catch (_) {}
      }

      showShareToast('Link disalin! Membuka Instagram Story...');

      // Buka Instagram Story Camera lewat URI scheme bawaan
      setTimeout(() => {
        window.location.href = 'instagram://camera';
      }, 400);

      // Reminder toast jika user masih di tab browser
      setTimeout(() => {
        showShareToast('Link karya tersimpan! Tempel stiker Tautan di Story kamu.');
      }, 2000);

      closeShareModal();
    });
  }

  // 2. OPSI WHATSAPP
  if (shareOptWhatsApp) {
    shareOptWhatsApp.addEventListener('click', () => {
      const shareUrl = activeSharePost.shareUrl;
      const authorName = activeSharePost.authorName;
      const desc = activeSharePost.description;
      const previewText = desc ? `"${desc.slice(0, 60)}${desc.length > 60 ? '...' : ''}"` : 'Karya Siswa DKV';
      const text = `Lihat karya ${previewText} oleh ${authorName} di portofolio digital XI DKV 3:\n${shareUrl}`;
      const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');
      closeShareModal();
    });
  }

  // 3. OPSI SALIN TAUTAN (COPY LINK)
  if (shareOptCopy) {
    shareOptCopy.addEventListener('click', async () => {
      const shareUrl = activeSharePost.shareUrl;
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(shareUrl);
        } else {
          const temp = document.createElement('input');
          temp.value = shareUrl;
          document.body.appendChild(temp);
          temp.select();
          document.execCommand('copy');
          document.body.removeChild(temp);
        }
      } catch (_) {
        prompt('Salin tautan karya ini:', shareUrl);
      }

      if (shareOptCopyBadge) {
        shareOptCopyBadge.textContent = 'Tersalin! \u2713';
        shareOptCopyBadge.classList.add('copied');
        setTimeout(() => {
          if (shareOptCopyBadge) {
            shareOptCopyBadge.textContent = 'Salin';
            shareOptCopyBadge.classList.remove('copied');
          }
        }, 2500);
      }

      showShareToast('Tautan karya berhasil disalin ke clipboard!');
    });
  }

  // 4. OPSI LAINNYA (NATIVE SHARE)
  if (shareOptNative) {
    shareOptNative.addEventListener('click', async () => {
      const shareUrl = activeSharePost.shareUrl;
      const authorName = activeSharePost.authorName;
      closeShareModal();

      if (navigator.share) {
        try {
          await navigator.share({
            title: `Karya ${authorName} - XI DKV`,
            text: `Cek karya ${authorName} di portofolio digital XI DKV 2025:`,
            url: shareUrl
          });
        } catch (err) {
          if (err.name !== 'AbortError') {
            showShareToast('Tautan berhasil disalin ke clipboard!');
          }
        }
      } else {
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(shareUrl);
          }
          showShareToast('Tautan karya berhasil disalin ke clipboard!');
        } catch (_) {
          prompt('Salin link karya ini:', shareUrl);
        }
      }
    });
  }

  // DELEGASI KLIK TOMBOL SHARE DI DAFTAR KARYA
  if (karyaScroll) {
    karyaScroll.addEventListener('click', (e) => {
      const shareBtn = e.target.closest('.post-share-btn');
      if (!shareBtn) return;

      const postId = shareBtn.dataset.postId;
      const shareUrl = `https://dkv-share.vercel.app/api?post=${postId}`;

      const card = shareBtn.closest('.karya-card');
      const img = card ? card.querySelector('.karya-image img, img') : null;
      const imageUrl = img ? (img.currentSrc || img.src) : '';
      const authorEl = card ? card.querySelector('.creator-name-link h4, .creator-info h4') : null;
      const authorName = authorEl ? authorEl.textContent.trim() : 'Siswa DKV';
      const categoryEl = card ? card.querySelector('.kategori') : null;
      const category = categoryEl ? categoryEl.textContent.trim() : 'Digital Art';
      const descEl = card ? card.querySelector('.creator-info p') : null;
      const description = descEl ? descEl.textContent.trim() : '';

      openShareModal({
        id: postId,
        shareUrl: shareUrl,
        imageUrl: imageUrl,
        authorName: authorName,
        category: category,
        description: description
      });
    });
  }

  // 2. FUNGSI AUTO-SCROLL
  async function checkSharedPost() {
    const urlParams = new URLSearchParams(window.location.search);
    const targetPostId = urlParams.get('post');

    if (targetPostId) {
      
      const targetElement = document.querySelector(`.post-share-btn[data-post-id="${targetPostId}"]`);
      
      if (targetElement) {
        const card = targetElement.closest('.karya-card');
        if (card) {
          setTimeout(() => {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            card.style.transition = 'box-shadow 0.4s ease';
            card.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.6)';
            
            setTimeout(() => {
              card.style.boxShadow = '';
            }, 3000);
          }, 800);
        }
      }
    }
  }

  
  // ============================================
  // FITUR LIGHTBOX / PREVIEW GAMBAR KARYA
  // ============================================
  function initImagePreviewModal() {
    const modal = document.getElementById('imagePreviewModal');
    const modalImg = document.getElementById('previewModalImage');
    const modalTitle = document.getElementById('previewModalTitle');
    const modalCaption = document.getElementById('previewModalCaption');
    const closeBtn = document.getElementById('previewModalClose');
    const backdrop = document.getElementById('previewModalBackdrop');

    if (!modal || !modalImg) return;

    function openPreview(src, title = '', caption = '') {
      if (!src) return;
      modalImg.src = src;
      modalImg.alt = title || 'Pratinjau Karya';

      if (modalTitle) {
        modalTitle.textContent = title || 'Pratinjau Karya';
      }

      if (modalCaption) {
        if (caption) {
          modalCaption.textContent = caption;
          modalCaption.style.display = 'block';
        } else {
          modalCaption.textContent = '';
          modalCaption.style.display = 'none';
        }
      }

      modal.classList.add('is-open');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('preview-modal-active');
    }

    function closePreview() {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('preview-modal-active');
      setTimeout(() => {
        if (!modal.classList.contains('is-open')) {
          modalImg.src = '';
        }
      }, 280);
    }

    if (closeBtn) closeBtn.addEventListener('click', closePreview);
    if (backdrop) backdrop.addEventListener('click', closePreview);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) {
        closePreview();
      }
    });

    // Delegasi klik global untuk seluruh gambar karya (carousel, showcase, galeri)
    document.addEventListener('click', (e) => {
      // Abaikan jika klik berada pada elemen aksi lain (tombol aksi, link profil, kontrol slideshow)
      if (e.target.closest('button, a, input, textarea, select, .slide-controls, .post-actions, .creator-avatar-link, .creator-name-link')) {
        return;
      }

      // 1. Karya Carousel di bagian Hero Slideshow
      const slideTarget = e.target.closest('.slideshow .slide');
      if (slideTarget) {
        const img = slideTarget.querySelector('img');
        if (img && (img.currentSrc || img.src)) {
          const author = slideTarget.querySelector('.featured-slide-info h2');
          const category = slideTarget.querySelector('.featured-slide-info span');
          const desc = slideTarget.querySelector('.featured-slide-info p');
          const title = author ? author.textContent.trim() : (img.alt || 'Karya Unggulan DKV');
          const caption = [
            category ? category.textContent.trim() : '',
            desc ? desc.textContent.trim() : ''
          ].filter(Boolean).join(' - ');
          openPreview(img.currentSrc || img.src, title, caption);
          return;
        }
      }

      // 2. Postingan Karya Siswa (Showcase)
      const karyaTarget = e.target.closest('.karya-image, .karya-card > img');
      if (karyaTarget) {
        const img = karyaTarget.tagName.toLowerCase() === 'img' ? karyaTarget : karyaTarget.querySelector('img');
        if (img && (img.currentSrc || img.src)) {
          const card = karyaTarget.closest('.karya-card');
          const author = card ? card.querySelector('.creator-name-link h4, .creator-info h4') : null;
          const category = card ? card.querySelector('.kategori') : null;
          const desc = card ? card.querySelector('.creator-info p') : null;
          const title = author ? author.textContent.trim() : (img.alt || 'Karya Siswa DKV');
          const caption = [
            category ? category.textContent.trim() : '',
            desc ? desc.textContent.trim() : ''
          ].filter(Boolean).join(' - ');
          openPreview(img.currentSrc || img.src, title, caption);
          return;
        }
      }

      // 3. Galeri Dokumentasi Angkatan
      const galeriTarget = e.target.closest('.grid-galeri img, .img-tile');
      if (galeriTarget) {
        const img = galeriTarget.tagName.toLowerCase() === 'img' ? galeriTarget : galeriTarget.querySelector('img');
        if (img && (img.currentSrc || img.src)) {
          const title = img.alt || 'Dokumentasi Galeri DKV';
          openPreview(img.currentSrc || img.src, title, 'Dokumentasi Kegiatan Siswa XI DKV');
          return;
        }
      }
    });
  }

  checkSharedPost();
  await setupLikeButtons();
  initImagePreviewModal();
});