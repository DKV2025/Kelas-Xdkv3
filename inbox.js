document.addEventListener('DOMContentLoaded', async () => {
  const inboxList = document.getElementById('inboxList');
  const activityList = document.getElementById('activityList');

  const inboxUserAvatar = document.getElementById('inboxUserAvatar');
  const inboxUsername = document.getElementById('inboxUsername');
  const inboxUserChip = document.getElementById('inboxUserChip');

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
      .select('*')
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
      .select('*')
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
    const date = new Date(dateString);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }

    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short'
    });
  }

  function formatActivityTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();

    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Baru saja';
    if (diffMinutes < 60) return `${diffMinutes} menit lalu`;
    if (diffHours < 24) return `${diffHours} jam lalu`;
    if (diffDays < 7) return `${diffDays} hari lalu`;

    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short'
    });
  }

  function renderCurrentUser() {
    if (!currentProfile) return;

    if (inboxUserAvatar) {
      inboxUserAvatar.src = currentProfile.avatar_url || 'images/pp-01.png';
    }

    if (inboxUsername) {
      inboxUsername.textContent = currentProfile.username || 'User';
    }

    if (inboxUserChip) {
      inboxUserChip.href = 'profile.html';
    }
  }

  async function renderInbox() {
    if (!inboxList) return;

    inboxList.innerHTML = `<p class="inbox-loading">Memuat riwayat chat...</p>`;

    const messages = await getAllMyMessages();

    if (!messages || messages.length === 0) {
      inboxList.innerHTML = `
        <p class="inbox-empty">
          Belum ada riwayat chat.
        </p>
      `;
      return;
    }

    const latestByPartner = new Map();

    messages.forEach((message) => {
      const partnerId =
        message.sender_id === currentUser.id
          ? message.receiver_id
          : message.sender_id;

      if (!latestByPartner.has(partnerId)) {
        latestByPartner.set(partnerId, message);
      }
    });

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

      const lastChatText =
        lastMessage.sender_id === currentUser.id
          ? `Anda: ${lastMessage.message}`
          : lastMessage.message;

      const card = document.createElement('a');
      card.className = 'inbox-card';
      card.href = `chat.html?userId=${partnerId}`;

      card.innerHTML = `
        <img
          src="${profile.avatar_url || 'images/pp-01.png'}"
          alt="Profile ${escapeHTML(profile.username || 'User')}"
        >

        <div class="inbox-card-info">
          <h2>${escapeHTML(profile.username || 'User')}</h2>

          <p class="last-chat">
            ${escapeHTML(lastChatText)}
          </p>
        </div>

        <span class="inbox-time">
          ${formatTime(lastMessage.created_at)}
        </span>
      `;

      inboxList.appendChild(card);
    });
  }

  async function getLikeActivities() {
    const { data: myPosts, error: postsError } = await supabaseClient
      .from('posts')
      .select('id, image_url, description, user_id')
      .eq('user_id', currentUser.id);

    if (postsError) {
      console.error('Gagal mengambil post milik user:', postsError);
      return [];
    }

    console.log('My posts:', myPosts);

    if (!myPosts || myPosts.length === 0) {
      return [];
    }

    const myPostIds = myPosts.map((post) => post.id);

    const { data: likes, error: likesError } = await supabaseClient
      .from('post_likes')
      .select('id, user_id, post_id, created_at')
      .in('post_id', myPostIds)
      .neq('user_id', currentUser.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (likesError) {
      console.error('Gagal mengambil likes:', likesError);
      return [];
    }

    console.log('Likes to my posts:', likes);

    if (!likes || likes.length === 0) {
      return [];
    }

    const likerIds = [...new Set(likes.map((like) => like.user_id))];

    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('id, username, avatar_url')
      .in('id', likerIds);

    if (profilesError) {
      console.error('Gagal mengambil profile liker:', profilesError);
      return [];
    }

    console.log('Liker profiles:', profiles);

    const postMap = new Map();
    const profileMap = new Map();

    myPosts.forEach((post) => {
      postMap.set(post.id, post);
    });

    profiles.forEach((profile) => {
      profileMap.set(profile.id, profile);
    });

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

    activityList.innerHTML = `<p class="inbox-loading">Memuat aktivitas...</p>`;

    const activities = await getLikeActivities();

    console.log('Final activities:', activities);

    if (!activities || activities.length === 0) {
      activityList.innerHTML = `
        <p class="inbox-empty">
          Belum ada aktivitas terbaru.
        </p>
      `;
      return;
    }

    activityList.innerHTML = '';

    activities.forEach((activity) => {
      const actor = activity.actor || {};
      const post = activity.post || {};

      const card = document.createElement('a');
      card.className = 'activity-card';
      card.href = `profile.html?userId=${activity.user_id}`;

      const avatar = document.createElement('img');
      avatar.className = 'activity-avatar';
      avatar.src = actor.avatar_url || 'images/pp-01.png';
      avatar.alt = 'Profile';

      const info = document.createElement('div');
      info.className = 'activity-info';

      const text = document.createElement('p');

      const strong = document.createElement('strong');
      strong.textContent = actor.username || 'User';

      text.appendChild(strong);
      text.append(' menyukai karya Anda');

      const time = document.createElement('span');
      time.textContent = formatActivityTime(activity.created_at);

      info.appendChild(text);
      info.appendChild(time);

      const thumb = document.createElement('img');
      thumb.className = 'activity-post-thumb';
      thumb.src = post.image_url || 'images/pp-01.png';
      thumb.alt = 'Karya';

      card.appendChild(avatar);
      card.appendChild(info);
      card.appendChild(thumb);

      activityList.appendChild(card);
    });
  }

  currentUser = await getCurrentUser();

  if (!currentUser) {
    alert('Kamu harus login dulu untuk melihat pesan.');
    window.location.href = 'login.html';
    return;
  }

  currentProfile = await getProfile(currentUser.id);

  renderCurrentUser();

  try {
    await renderInbox();
  } catch (error) {
    console.error('Render inbox error:', error);

    if (inboxList) {
      inboxList.innerHTML = `
        <p class="inbox-empty">
          Riwayat chat belum bisa dimuat.
        </p>
      `;
    }
  }

  try {
    await renderActivities();
  } catch (error) {
    console.error('Render aktivitas error:', error);

    if (activityList) {
      activityList.innerHTML = `
        <p class="inbox-empty">
          Aktivitas belum bisa dimuat.
        </p>
      `;
    }
  }

  localStorage.setItem(
    `xdkv3_lastInboxSeen_${currentUser.id}`,
    new Date().toISOString()
  );
});
