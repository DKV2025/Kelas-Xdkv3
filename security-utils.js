function escapeHTML(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char];
  });
}

async function logActivity(action, targetType = null, targetId = null, metadata = {}) {
  const { data, error } = await supabaseClient.auth.getUser();

  if (error || !data.user) return;

  await supabaseClient
    .from('activity_logs')
    .insert({
      user_id: data.user.id,
      action,
      target_type: targetType,
      target_id: targetId,
      metadata
    });
}

window.escapeHTML = escapeHTML;
window.logActivity = logActivity;