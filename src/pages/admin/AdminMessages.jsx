import { useState, useEffect, useRef } from 'react';
import { Send, Search, Mail, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

/**
 * AdminMessages — real two-way messaging via Supabase.
 *
 * Assumes these tables (matching the guest Messages page):
 *
 *   conversations (
 *     id uuid PK,
 *     guest_id uuid → auth.users,
 *     guest_name text,
 *     guest_email text,
 *     apartment text,
 *     last_message_at timestamptz,
 *     unread_by_admin int default 0,
 *     unread_by_guest int default 0
 *   )
 *
 *   messages (
 *     id uuid PK,
 *     conversation_id uuid → conversations,
 *     from_admin boolean,
 *     body text,
 *     created_at timestamptz
 *   )
 *
 * Adjust field names below if your migration used different ones.
 */

export default function AdminMessages() {
  const [convos, setConvos] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const threadRef = useRef(null);

  // ── Load conversations + subscribe to changes ──
  useEffect(() => {
    loadConversations();

    const sub = supabase
      .channel('admin-conversations')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations' },
        () => loadConversations()
      )
      .subscribe();

    return () => { supabase.removeChannel(sub); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load messages when active conversation changes + subscribe to new ones ──
  useEffect(() => {
    if (!activeId) return;

    loadMessages(activeId);
    markAsRead(activeId);

    const sub = supabase
      .channel(`admin-thread-${activeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeId}`,
        },
        (payload) => {
          setMessages(prev => {
            // Avoid duplicates (own message may already be in state)
            if (prev.some(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
          // If guest sent a new message while thread is open, mark it read
          if (!payload.new.from_admin) markAsRead(activeId);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(sub); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Scroll thread to bottom on new messages
  useEffect(() => {
    threadRef.current?.scrollTo({ top: 99999, behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (!error && data) {
      setConvos(data);
      if (!activeId && data.length > 0) {
        setActiveId(data[0].id);
      }
    }
    setLoading(false);
  };

  const loadMessages = async (convoId) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', convoId)
      .order('created_at', { ascending: true });

    if (!error && data) setMessages(data);
  };

  const markAsRead = async (convoId) => {
    setConvos(prev => prev.map(c =>
      c.id === convoId ? { ...c, unread_by_admin: 0 } : c
    ));
    await supabase
      .from('conversations')
      .update({ unread_by_admin: 0 })
      .eq('id', convoId);
  };

  const send = async (e) => {
    e.preventDefault();
    if (!draft.trim() || !activeId || sending) return;

    const body = draft.trim();
    setDraft('');
    setSending(true);

    const active = convos.find(c => c.id === activeId);

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: activeId,
        from_admin: true,
        body,
      });

    if (error) {
      setDraft(body); // restore on failure
      setSending(false);
      return;
    }

    // Update conversation: bump timestamp + guest's unread count
    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        unread_by_guest: (active?.unread_by_guest || 0) + 1,
      })
      .eq('id', activeId);

    setSending(false);
    // The message will appear via realtime subscription
  };

  const active = convos.find(c => c.id === activeId);
  const filtered = convos.filter(c =>
    (c.guest_name || '').toLowerCase().includes(q.toLowerCase()) ||
    (c.apartment || '').toLowerCase().includes(q.toLowerCase()) ||
    (c.guest_email || '').toLowerCase().includes(q.toLowerCase())
  );

  const avatar = (name) => {
    if (!name) return 'G';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="mgmt-page">
        <header className="ad-page-head">
          <span className="ad-eyebrow">MESSAGES</span>
          <h1>Messages</h1>
        </header>
        <div className="ad-empty"><p>Loading conversations…</p></div>
      </div>
    );
  }

  return (
    <div className="mgmt-page ad-messages-page">
      <header className="ad-page-head">
        <span className="ad-eyebrow">MESSAGES</span>
        <h1>Messages</h1>
        <p className="ad-lead">Reply to guest questions. Guests see your replies instantly.</p>
      </header>

      {convos.length === 0 ? (
        <div className="ad-empty">
          <p>No conversations yet. Guests can start one from their dashboard.</p>
        </div>
      ) : (
        <div className="ad-messages">
          {/* Left: conversation list */}
          <aside className="ad-msg-list">
            <div className="ad-msg-search">
              <Search size={13} />
              <input
                type="text"
                placeholder="Search guests…"
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>

            {filtered.length === 0 && (
              <div className="ad-empty"><p>No matches.</p></div>
            )}

            {filtered.map(c => (
              <button
                key={c.id}
                className={`ad-msg-item${c.id === activeId ? ' active' : ''}`}
                onClick={() => setActiveId(c.id)}
              >
                <div className="ad-msg-avatar">{avatar(c.guest_name)}</div>
                <div className="ad-msg-body">
                  <div className="ad-msg-top">
                    <span className="ad-msg-name">{c.guest_name || 'Guest'}</span>
                    <span className="ad-msg-time">
                      {c.last_message_at
                        ? formatDistanceToNow(new Date(c.last_message_at), { addSuffix: false })
                        : ''}
                    </span>
                  </div>
                  <div className="ad-msg-sub">{c.apartment || 'General'}</div>
                </div>
                {c.unread_by_admin > 0 && (
                  <span className="ad-msg-unread">{c.unread_by_admin}</span>
                )}
              </button>
            ))}
          </aside>

          {/* Right: thread */}
          <section className="ad-msg-thread-wrap">
            {!active ? (
              <div className="ad-empty"><p>Select a conversation.</p></div>
            ) : (
              <>
                <div className="ad-msg-thread-head">
                  <div className="ad-msg-avatar">{avatar(active.guest_name)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="ad-msg-name">{active.guest_name || 'Guest'}</div>
                    <div className="ad-msg-sub">
                      {active.apartment}
                      {active.guest_email ? ` · ${active.guest_email}` : ''}
                    </div>
                  </div>
                  <div className="ad-msg-head-actions">
                    {active.guest_email && (
                      <a
                        href={`mailto:${active.guest_email}?subject=${encodeURIComponent('Re: Your stay — Home-Office Apartments')}`}
                        className="ad-btn ad-btn-outline ad-btn-sm"
                      >
                        <Mail size={13} /> Email
                      </a>
                    )}
                  </div>
                </div>

                <div className="ad-msg-thread" ref={threadRef}>
                  {messages.length === 0 && (
                    <div className="ad-empty"><p>No messages yet.</p></div>
                  )}
                  {messages.map(m => (
                    <div
                      key={m.id}
                      className={`ad-msg-bubble ${m.from_admin ? 'me' : 'them'}`}
                    >
                      <div>{m.body}</div>
                      <div className="ad-msg-at">
                        {m.from_admin ? 'You' : (active.guest_name?.split(' ')[0] || 'Guest')}
                        {' · '}
                        {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  ))}
                </div>

                <form className="ad-msg-composer" onSubmit={send}>
                  <input
                    type="text"
                    placeholder={`Reply to ${active.guest_name?.split(' ')[0] || 'guest'}…`}
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
