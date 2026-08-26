import { useState, useEffect, useRef } from 'react';
import { Send, Search, Mail, Phone } from 'lucide-react';
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
 */

export default function AdminMessages() {
  const [allMessages, setAllMessages] = useState([]);
  const [activeGuestId, setActiveGuestId] = useState(null);
  const [draft, setDraft] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const threadRef = useRef(null);

  // ── Load all messages, subscribe to realtime inserts/updates ──
  useEffect(() => {
    loadMessages();

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
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setAllMessages(data);
      // Auto-select first guest thread if none selected yet
      if (!activeGuestId && data.length > 0) {
        const firstGuest = data[0].guest_id;
        setActiveGuestId(firstGuest);
      }
    }
    setLoading(false);
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

    const active = threads.find(t => t.guest_id === activeGuestId);
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

  const active = threads.find(t => t.guest_id === activeGuestId);
  const filtered = threads.filter(t =>
    t.guest_name.toLowerCase().includes(q.toLowerCase()) ||
    t.apartment.toLowerCase().includes(q.toLowerCase()) ||
    t.guest_email.toLowerCase().includes(q.toLowerCase())
  );

  const avatar = (name) => {
    if (!name) return 'G';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
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
        <p className="mgmt-lead">Reply to guest questions. Guests see your replies instantly.</p>
      </header>

      {threads.length === 0 ? (
        <div className="mgmt-empty">
          <p>No conversations yet. Guests can message you from their dashboard.</p>
        </div>
      ) : (
        <div className="mgmt-messages">
          {/* Left: thread list */}
          <aside className="mgmt-msg-list">
            <div className="mgmt-msg-search">
              <Search size={13} />
              <input
                type="text"
                placeholder="Search guests…"
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>

            {filtered.length === 0 && (
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
                  <div className="mgmt-msg-sub">{t.apartment || 'General'}</div>
                  <div className="mgmt-msg-preview">
                    {t.messages[t.messages.length - 1]?.body}
                  </div>
                </div>
                {t.unread > 0 && (
                  <span className="mgmt-msg-unread">{t.unread}</span>
                )}
              </button>
            ))}
          </aside>

          {/* Right: thread */}
          <section className="mgmt-msg-thread-wrap">
            {!active ? (
              <div className="mgmt-empty"><p>Select a conversation.</p></div>
            ) : (
              <>
                <div className="mgmt-msg-thread-head">
                  <div className="mgmt-msg-avatar">{avatar(active.guest_name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="mgmt-msg-name">{active.guest_name}</div>
                    <div className="mgmt-msg-sub">
                      {active.apartment}
                      {active.guest_email ? ` · ${active.guest_email}` : ''}
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
                  {active.messages.map(m => (
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
                    placeholder={`Reply to ${active.guest_name.split(' ')[0]}…`}
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
      )}
    </div>
  );
}
