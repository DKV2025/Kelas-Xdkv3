document.addEventListener('DOMContentLoaded', async () => {
  const inboxList = document.getElementById('inboxList');
  const activityList = document.getElementById('activityList');
  const navAuth = document.getElementById('navAuth');

  let currentUser = null;
  let currentProfile = null;

  async function getCurrentUser() {
    const { data, error } = await supabaseClient.auth.getUser();
    if (error || !data.user) {
      return null;
    }
    return data.user;
  }

  async function getProfile(userId) {
    const { data, error } = await supabaseClient
      .from('profiles')
      .select('id, username, avatar_url, class_tag')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Gagal mengambil profile:', error);
      return null;
    }

    return data;
  }

  async function getProfiles(userIds) {
    if (!userIds || userIds.length === 0) return [];

    const { data, error } = await supabaseClient
      .from('profiles')
      .select('id, username, avatar_url, class_tag')
      .in('id', userIds);

    if (error) {
      console.error('Gagal mengambil profiles:', error);
      return [];
    }

    return data || [];
  }

  async function getAllMyMessages() {
    const { data, error } = await supabaseClient
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${currentUser.id},receiver_id.eq.${currentUser.id}`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Gagal mengambil messages:', error);
      return [];
    }

    return data || [];
  }

  function escapeHTML(text) {
    return String(text || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function formatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Kemarin';
    }

    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short'
    });
  }

  function formatActivityTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();

    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Baru saja';
    if (diffMinutes < 60) return `${diffMinutes} mnt lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari lalu`;

    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short'
    });
  }

  function renderNavAuth() {
    if (!navAuth || !currentUser || !currentProfile) return;
    navAuth.innerHTML = `
      <a href="profile.html" class="profile-chip" title="Profil ${escapeHTML(currentProfile.username || 'Saya')}">
        <img src="${currentProfile.avatar_url || 'images/pp-01.png'}" alt="Profile">
        <span>${escapeHTML(currentProfile.username || 'Profil')}</span>
      </a>
    `;
  }

  function setupTabs() {
    const tabButtons = document.querySelectorAll('.inbox-tab-btn');
    const inboxColumns = document.getElementById('inboxColumns');
    if (!tabButtons.length || !inboxColumns) return;

    const isMobile = window.innerWidth <= 768;
    let activeTab = isMobile ? 'chat' : 'all';

    function setTab(tabName) {
      activeTab = tabName;
      tabButtons.forEach(btn => {
        const isMatch = btn.dataset.tab === tabName;
        btn.classList.toggle('active', isMatch);
        btn.setAttribute('aria-selected', isMatch ? 'true' : 'false');
      });

      inboxColumns.className = `inbox-columns view-${tabName}`;
    }

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        setTab(btn.dataset.tab);
      });
    });

    setTab(activeTab);

    window.addEventListener('resize', () => {
      if (window.innerWidth <= 768 && activeTab === 'all') {
        setTab('chat');
      }
    });
  }

  async function renderInbox() {
    if (!inboxList) return;

    inboxList.innerHTML = `
      <div class="inbox-loading-state">
        <div class="inbox-spinner"></div>
        <p>Memuat riwayat chat...</p>
      </div>
    `;

    const messages = await getAllMyMessages();

    if (!messages || messages.length === 0) {
      inboxList.innerHTML = `
        <div class="inbox-empty-box">
          <svg class="inbox-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <h3 class="inbox-empty-title">Belum ada obrolan</h3>
          <p class="inbox-empty-desc">Mulai obrolan dengan teman seangkatan atau kirim apresiasi atas karya mereka.</p>
          <a href="index.html#karya" class="inbox-empty-cta">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <span>Jelajahi Karya Siswa</span>
          </a>
        </div>
      `;
      const chatUnreadBadge = document.getElementById('chatUnreadBadge');
      if (chatUnreadBadge) chatUnreadBadge.style.display = 'none';
      return;
    }

    const latestByPartner = new Map();
    const unreadCountByPartner = new Map();
    let totalUnreadMessages = 0;

    messages.forEach((message) => {
      const partnerId =
        message.sender_id === currentUser.id
          ? message.receiver_id
          : message.sender_id;

      if (!latestByPartner.has(partnerId)) {
        latestByPartner.set(partnerId, message);
      }

      if (message.sender_id === partnerId && message.receiver_id === currentUser.id && !message.read_at) {
        unreadCountByPartner.set(partnerId, (unreadCountByPartner.get(partnerId) || 0) + 1);
        totalUnreadMessages++;
      }
    });

    const chatUnreadBadge = document.getElementById('chatUnreadBadge');
    if (chatUnreadBadge) {
      if (totalUnreadMessages > 0) {
        chatUnreadBadge.textContent = totalUnreadMessages > 99 ? '99+' : totalUnreadMessages;
        chatUnreadBadge.style.display = 'inline-flex';
      } else {
        chatUnreadBadge.style.display = 'none';
      }
    }

    const partnerIds = Array.from(latestByPartner.keys());
    const profiles = await getProfiles(partnerIds);

    const profileMap = new Map();
    profiles.forEach((profile) => {
      profileMap.set(profile.id, profile);
    });

    inboxList.innerHTML = '';

    partnerIds.forEach((partnerId) => {
      const profile = profileMap.get(partnerId);
      const lastMessage = latestByPartner.get(partnerId);

      if (!profile || !lastMessage) return;

      const unreadCount = unreadCountByPartner.get(partnerId) || 0;
      const isSentByMe = lastMessage.sender_id === currentUser.id;

      const lastChatText = isSentByMe
        ? `Anda: ${lastMessage.message}`
        : lastMessage.message;

      const card = document.createElement('a');
      card.className = `inbox-card ${unreadCount > 0 ? 'has-unread' : ''}`;
      card.href = `chat.html?userId=${partnerId}`;

      card.innerHTML = `
        <div class="inbox-card-avatar-wrap">
          <img
            class="inbox-card-avatar"
            src="${profile.avatar_url || 'images/pp-01.png'}"
            alt="Foto ${escapeHTML(profile.username || 'User')}"
            loading="lazy"
          >
          ${unreadCount > 0 ? '<span class="inbox-unread-dot" title="Pesan baru"></span>' : ''}
        </div>

        <div class="inbox-card-content">
          <div class="inbox-card-header">
            <div class="inbox-card-name-row">
              <h3 class="inbox-card-name">${escapeHTML(profile.username || 'User')}</h3>
              ${profile.class_tag ? `<span class="inbox-class-tag">${escapeHTML(profile.class_tag)}</span>` : ''}
            </div>
            <span class="inbox-time">${formatTime(lastMessage.created_at)}</span>
          </div>

          <div class="inbox-card-bottom">
            <p class="last-chat">${escapeHTML(lastChatText)}</p>
            ${unreadCount > 0 ? `<span class="inbox-card-badge">${unreadCount}</span>` : ''}
          </div>
        </div>
      `;

      inboxList.appendChild(card);
    });
  }

  async function getLikeActivities() {
    const { data: myPosts, error: postsError } = await supabaseClient
      .from('posts')
      .select('id, image_url, description, user_id')
      .eq('user_id', currentUser.id);

    if (postsError || !myPosts || myPosts.length === 0) {
      return [];
    }

    const myPostIds = myPosts.map((post) => post.id);

    const { data: likes, error: likesError } = await supabaseClient
      .from('post_likes')
      .select('id, user_id, post_id, created_at')
      .in('post_id', myPostIds)
      .neq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (likesError || !likes || likes.length === 0) {
      return [];
    }

    const likerIds = [...new Set(likes.map((like) => like.user_id))];

    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, username, avatar_url, class_tag')
      .in('id', likerIds);

    if (profilesError) {
      return [];
    }

    const postMap = new Map();
    const profileMap = new Map();

    myPosts.forEach((post) => postMap.set(post.id, post));
    (profiles || []).forEach((profile) => profileMap.set(profile.id, profile));

    return likes.map((like) => {
      return {
        id: like.id,
        user_id: like.user_id,
        post_id: like.post_id,
        created_at: like.created_at,
        actor: profileMap.get(like.user_id),
        post: postMap.get(like.post_id)
      };
    });
  }

  async function renderActivities() {
    if (!activityList) return;

    activityList.innerHTML = `
      <div class="inbox-loading-state">
        <div class="inbox-spinner"></div>
        <p>Memuat aktivitas...</p>
      </div>
    `;

    const activities = await getLikeActivities();

    if (!activities || activities.length === 0) {
      activityList.innerHTML = `
        <div class="inbox-empty-box">
          <svg class="inbox-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
          <h3 class="inbox-empty-title">Belum ada aktivitas</h3>
          <p class="inbox-empty-desc">Saat karya yang kamu unggah disukai teman-teman, notifikasi apresiasi akan muncul di sini.</p>
          <a href="upload.html" class="inbox-empty-cta">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Unggah Karya Baru</span>
          </a>
        </div>
      `;
      const activityBadge = document.getElementById('activityBadge');
      if (activityBadge) activityBadge.style.display = 'none';
      return;
    }

    const activityBadge = document.getElementById('activityBadge');
    if (activityBadge) {
      activityBadge.textContent = activities.length > 99 ? '99+' : activities.length;
      activityBadge.style.display = 'inline-flex';
    }

    activityList.innerHTML = '';

    activities.forEach((activity) => {
      const actor = activity.actor || {};
      const post = activity.post || {};

      const card = document.createElement('a');
      card.className = 'activity-card';
      card.href = `profile.html?userId=${activity.user_id}`;

      card.innerHTML = `
        <img
          class="activity-avatar"
          src="${actor.avatar_url || 'images/pp-01.png'}"
          alt="Foto ${escapeHTML(actor.username || 'User')}"
          loading="lazy"
        >
        <div class="activity-info">
          <p>
            <strong>${escapeHTML(actor.username || 'User')}</strong>
            menyukai karya Anda
          </p>
          <span class="activity-time-text">${formatActivityTime(activity.created_at)}</span>
        </div>
        <img
          class="activity-post-thumb"
          src="${post.image_url || 'images/pp-01.png'}"
          alt="Thumbnail Karya"
          loading="lazy"
        >
      `;

      activityList.appendChild(card);
    });
  }

  // Initialization
  currentUser = await getCurrentUser();

  if (!currentUser) {
    alert('Kamu harus login dulu untuk melihat pesan.');
    window.location.href = 'login.html';
    return;
  }

  currentProfile = await getProfile(currentUser.id);

  renderNavAuth();
  setupTabs();

  try {
    await renderInbox();
  } catch (error) {
    console.error('Render inbox error:', error);
    if (inboxList) {
      inboxList.innerHTML = `<p class="inbox-empty">Riwayat chat belum bisa dimuat.</p>`;
    }
  }

  try {
    await renderActivities();
  } catch (error) {
    console.error('Render aktivitas error:', error);
    if (activityList) {
      activityList.innerHTML = `<p class="inbox-empty">Aktivitas belum bisa dimuat.</p>`;
    }
  }

  localStorage.setItem(
    `xdkv3_lastInboxSeen_${currentUser.id}`,
    new Date().toISOString()
  );
});
