import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Search, Mail, Phone, SquarePen, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

/**
 * AdminMessages — matches the REAL live schema (single flat `messages` table,
 * no `conversations` table). Grouped client-side by guest_id.
 *
 * Real columns: id, guest_id, guest_name, guest_email, guest_phone,
 *               apartment, from_admin, body, created_at,
 *               read_by_admin, read_by_guest
 *
 * RLS (already correct, verified live):
 *   - guests see only their own thread (guest_id = auth.uid()) or admins see all
 *   - insert: from_admin=true requires is_admin(); from_admin=false requires guest_id = auth.uid()
 *   - no impersonation possible either direction
 *
 * Composing to a guest with no prior thread: `messages` only comes into
 * being once a row exists, so there's no thread to select until the
 * first message is sent. The "New message" picker (below) works off
 * `profiles` directly, and `active` falls back to a profile-built
 * "empty thread" so the composer/header still have a name to show
 * before that first send creates the real thread.
 */

export default function AdminMessages() {
  const [searchParams] = useSearchParams();
  const [allMessages, setAllMessages] = useState([]);
  const [profiles, setProfiles] = useState([]);
  // Pre-selects a thread when arriving via AdminGuestDetail's "Message
  // guest" link (?guest=<id>) — works even if that guest has no thread
  // yet, via the `active` fallback below.
  const [activeGuestId, setActiveGuestId] = useState(searchParams.get('guest'));
  const [draft, setDraft] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [composing, setComposing] = useState(false);
  const [composeQuery, setComposeQuery] = useState('');
  const threadRef = useRef(null);

  // ── Load all messages, subscribe to realtime inserts/updates ──
  useEffect(() => {
    loadMessages();
    loadProfiles();

    const sub = supabase
      .channel('admin-messages')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages' },
        () => loadMessages()
      )
      .subscribe();

    return () => { supabase.removeChannel(sub); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mark active thread as read whenever it changes or new messages arrive
  useEffect(() => {
    if (activeGuestId) markThreadRead(activeGuestId);
  }, [activeGuestId, allMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    threadRef.current?.scrollTo({ top: 99999, behavior: 'smooth' });
  }, [activeGuestId, allMessages]);

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && data) {
        setAllMessages(data);
        // Auto-select the first thread only when nothing's selected at
        // all — a deep-linked ?guest= with no messages yet is a valid
        // "compose to this guest" state, not a miss to fall back from.
        if (!activeGuestId && data.length > 0) {
          setActiveGuestId(data[0].guest_id);
        }
      }
    } catch {
      // A network-level failure would otherwise leave this stuck on
      // "Loading…" forever.
    } finally {
      setLoading(false);
    }
  };

  // Every registered guest, for the "New message" picker — a guest
  // needs no prior thread (or even a booking) to be messaged.
  const loadProfiles = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone')
      .order('full_name', { ascending: true });
    if (data) setProfiles(data);
  };

  const markThreadRead = async (guestId) => {
    const unread = allMessages.filter(
      m => m.guest_id === guestId && !m.from_admin && !m.read_by_admin
    );
    if (unread.length === 0) return;

    // Optimistic local update
    setAllMessages(prev => prev.map(m =>
      m.guest_id === guestId && !m.from_admin ? { ...m, read_by_admin: true } : m
    ));

    await supabase
      .from('messages')
      .update({ read_by_admin: true })
      .eq('guest_id', guestId)
      .eq('from_admin', false)
      .eq('read_by_admin', false);
  };

  const send = async (e) => {
    e.preventDefault();
    if (!draft.trim() || !activeGuestId || sending) return;

    const body = draft.trim();
    setDraft('');
    setSending(true);

    const { error } = await supabase.from('messages').insert({
      guest_id: activeGuestId,
      guest_name: active?.guest_name || null,
      guest_email: active?.guest_email || null,
      guest_phone: active?.guest_phone || null,
      apartment: active?.apartment || null,
      from_admin: true,
      body,
      read_by_admin: true,
      read_by_guest: false,
    });

    if (error) {
      setDraft(body); // restore on failure
    }
    setSending(false);
    // New message shows via realtime subscription
  };

  // ── Group messages into per-guest threads ──
  const threadMap = {};
  allMessages.forEach(m => {
    const key = m.guest_id;
    if (!key) return;
    if (!threadMap[key]) {
      threadMap[key] = {
        guest_id: key,
        guest_name: m.guest_name || 'Guest',
        guest_email: m.guest_email || '',
        guest_phone: m.guest_phone || '',
        apartment: m.apartment || '',
        messages: [],
        lastAt: m.created_at,
      };
    }
    threadMap[key].messages.push(m);
    threadMap[key].lastAt = m.created_at;
    // Prefer the most recent non-null guest info
    if (m.guest_name) threadMap[key].guest_name = m.guest_name;
    if (m.guest_email) threadMap[key].guest_email = m.guest_email;
    if (m.guest_phone) threadMap[key].guest_phone = m.guest_phone;
    if (m.apartment) threadMap[key].apartment = m.apartment;
  });

  const threads = Object.values(threadMap)
    .map(t => ({
      ...t,
      unread: t.messages.filter(m => !m.from_admin && !m.read_by_admin).length,
    }))
    .sort((a, b) => new Date(b.lastAt) - new Date(a.lastAt));

  // A guest picked from "New message" (or a ?guest= deep link) with no
  // messages yet isn't in `threads` — build an empty one from their
  // profile so the header/composer still have a name to show.
  const profileById = {};
  profiles.forEach(p => { profileById[p.id] = p; });

  const active = threads.find(t => t.guest_id === activeGuestId) || (() => {
    const p = activeGuestId && profileById[activeGuestId];
    if (!p) return null;
    return {
      guest_id: p.id,
      guest_name: p.full_name || 'Guest',
      guest_email: p.email || '',
      guest_phone: p.phone || '',
      apartment: '',
      messages: [],
      unread: 0,
    };
  })();

  const filtered = threads.filter(t =>
    t.guest_name.toLowerCase().includes(q.toLowerCase()) ||
    t.guest_email.toLowerCase().includes(q.toLowerCase())
  );

  const threadGuestIds = new Set(threads.map(t => t.guest_id));
  const composeResults = profiles.filter(p =>
    (p.full_name || '').toLowerCase().includes(composeQuery.toLowerCase()) ||
    (p.email || '').toLowerCase().includes(composeQuery.toLowerCase())
  );

  const avatar = (name) => {
    if (!name) return 'G';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const startCompose = (profile) => {
    setActiveGuestId(profile.id);
    setComposing(false);
    setComposeQuery('');
  };

  if (loading) {
    return (
      <div className="mgmt-page">
        <header className="mgmt-page-head">
          <span className="mgmt-eyebrow">MESSAGES</span>
          <h1>Messages</h1>
        </header>
        <div className="mgmt-empty"><p>Loading conversations…</p></div>
      </div>
    );
  }

  return (
    <div className="mgmt-page mgmt-messages-page">
      <header className="mgmt-page-head">
        <span className="mgmt-eyebrow">MESSAGES</span>
        <h1>Messages</h1>
        <p className="mgmt-lead">Message any guest, or reply to one who's written in. They see it instantly.</p>
      </header>

      <div className="mgmt-messages">
        {/* Left: thread list, or the "new message" guest picker */}
        <aside className="mgmt-msg-list">
          {composing ? (
            <>
              <div className="mgmt-msg-compose-head">
                <button type="button" className="mgmt-icon-btn" onClick={() => { setComposing(false); setComposeQuery(''); }} aria-label="Back">
                  <ArrowLeft size={16} />
                </button>
                <span>New message</span>
              </div>
              <div className="mgmt-msg-search">
                <Search size={13} />
                <input
                  type="text"
                  placeholder="Search guests by name or email…"
                  value={composeQuery}
                  onChange={e => setComposeQuery(e.target.value)}
                  autoFocus
                />
              </div>

              {composeResults.length === 0 && (
                <div className="mgmt-empty"><p>No guests match.</p></div>
              )}

              {composeResults.map(p => (
                <button key={p.id} className="mgmt-msg-item" onClick={() => startCompose(p)}>
                  <div className="mgmt-msg-avatar">{avatar(p.full_name)}</div>
                  <div className="mgmt-msg-body">
                    <div className="mgmt-msg-top">
                      <span className="mgmt-msg-name">{p.full_name || 'Guest'}</span>
                    </div>
                    <div className="mgmt-msg-preview">
                      {p.email}
                      {threadGuestIds.has(p.id) && ' · Existing conversation'}
                    </div>
                  </div>
                </button>
              ))}
            </>
          ) : (
            <>
              <div className="mgmt-msg-search">
                <Search size={13} />
                <input
                  type="text"
                  placeholder="Search guests…"
                  value={q}
                  onChange={e => setQ(e.target.value)}
                />
                <button type="button" className="mgmt-msg-compose-btn" onClick={() => setComposing(true)} title="New message">
                  <SquarePen size={15} />
                </button>
              </div>

              {threads.length === 0 && (
                <div className="mgmt-empty"><p>No conversations yet. Start one with "New message" above.</p></div>
              )}
              {threads.length > 0 && filtered.length === 0 && (
                <div className="mgmt-empty"><p>No matches.</p></div>
              )}

              {filtered.map(t => (
                <button
                  key={t.guest_id}
                  className={`mgmt-msg-item${t.guest_id === activeGuestId ? ' active' : ''}`}
                  onClick={() => setActiveGuestId(t.guest_id)}
                >
                  <div className="mgmt-msg-avatar">{avatar(t.guest_name)}</div>
                  <div className="mgmt-msg-body">
                    <div className="mgmt-msg-top">
                      <span className="mgmt-msg-name">{t.guest_name}</span>
                      <span className="mgmt-msg-time">
                        {formatDistanceToNow(new Date(t.lastAt), { addSuffix: false })}
                      </span>
                    </div>
                    <div className="mgmt-msg-preview">
                      {t.messages[t.messages.length - 1]?.body}
                    </div>
                  </div>
                  {t.unread > 0 && (
                    <span className="mgmt-msg-unread">{t.unread}</span>
                  )}
                </button>
              ))}
            </>
          )}
        </aside>

        {/* Right: thread */}
        <section className="mgmt-msg-thread-wrap">
          {!active ? (
            <div className="mgmt-empty"><p>Select a conversation, or start a new one.</p></div>
          ) : (
            <>
              <div className="mgmt-msg-thread-head">
                <div className="mgmt-msg-avatar">{avatar(active.guest_name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mgmt-msg-name">{active.guest_name}</div>
                  <div className="mgmt-msg-sub">
                    {active.guest_email || ''}
                  </div>
                </div>
                <div className="mgmt-msg-head-actions">
                  {active.guest_email && (
                    <a
                      href={`mailto:${active.guest_email}?subject=${encodeURIComponent('Re: Your stay — Home-Office Apartments')}`}
                      className="mgmt-btn mgmt-btn-outline mgmt-btn-sm"
                    >
                      <Mail size={13} /> Email
                    </a>
                  )}
                  {active.guest_phone && (
                    <a href={`tel:${active.guest_phone}`} className="mgmt-btn mgmt-btn-outline mgmt-btn-sm">
                      <Phone size={13} /> Call
                    </a>
                  )}
                </div>
              </div>

              <div className="mgmt-msg-thread" ref={threadRef}>
                {active.messages.length === 0 ? (
                  <div className="mgmt-empty"><p>No messages yet — say hello to {active.guest_name.split(' ')[0]}.</p></div>
                ) : active.messages.map(m => (
                  <div
                    key={m.id}
                    className={`mgmt-msg-bubble ${m.from_admin ? 'me' : 'them'}`}
                  >
                    <div>{m.body}</div>
                    <div className="mgmt-msg-at">
                      {m.from_admin ? 'You' : active.guest_name.split(' ')[0]}
                      {' · '}
                      {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                    </div>
                  </div>
                ))}
              </div>

              <form className="mgmt-msg-composer" onSubmit={send}>
                <input
                  type="text"
                  placeholder={`Message ${active.guest_name.split(' ')[0]}…`}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  disabled={sending}
                />
                <button type="submit" disabled={!draft.trim() || sending}>
                  <Send size={15} />
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
