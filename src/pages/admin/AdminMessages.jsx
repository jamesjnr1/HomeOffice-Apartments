import { useState, useRef, useEffect } from 'react';
import { Send, Search, Mail, Phone, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';

/**
 * AdminMessages
 *
 * Uses Supabase `messages` table. Schema (run once in SQL Editor):
 *
 *   create table if not exists public.messages (
 *     id           uuid primary key default gen_random_uuid(),
 *     guest_id     uuid references auth.users(id) on delete cascade,
 *     guest_name   text,
 *     guest_email  text,
 *     apartment    text,
 *     from_admin   boolean default false,
 *     body         text not null,
 *     created_at   timestamptz default now()
 *   );
 *
 *   alter table public.messages enable row level security;
 *
 *   -- Guests can see their own messages + admin replies:
 *   create policy "guests read own" on public.messages
 *     for select using (guest_id = auth.uid() or from_admin = true);
 *
 *   -- Anyone authenticated can insert:
 *   create policy "authenticated insert" on public.messages
 *     for insert with check (auth.role() = 'authenticated');
 *
 * Falls back to mock data if Supabase table doesn't exist yet.
 */

const MOCK = [
  {
    id: 'c1',
    guest_id: 'mock-1',
    guest: 'Abena Mensah',
    avatar: 'AM',
    email: 'abena@example.com',
    phone: '+233 24 000 0001',
    apartment: 'Verandah Apartment',
    unread: 1,
    lastAt: new Date(Date.now() - 30 * 60000),
    messages: [
      { id: 'm1', from_admin: false, body: 'Hi, just checking if 10–15 Oct is available?', created_at: new Date(Date.now() - 30 * 60000) },
    ],
  },
  {
    id: 'c2',
    guest_id: 'mock-2',
    guest: 'Kofi Asante',
    avatar: 'KA',
    email: 'kofi@example.com',
    phone: '+233 20 000 0002',
    apartment: 'Garden Apartment',
    unread: 1,
    lastAt: new Date(Date.now() - 2 * 3600000),
    messages: [
      { id: 'm2', from_admin: true, body: 'Hi Kofi, confirmed for 20–24 Oct!', created_at: new Date(Date.now() - 3 * 3600000) },
      { id: 'm3', from_admin: false, body: 'Will there be parking?', created_at: new Date(Date.now() - 2 * 3600000) },
    ],
  },
];

export default function AdminMessages() {
  const [convos, setConvos] = useState(MOCK);
  const [activeId, setActiveId] = useState('c1');
  const [draft, setDraft] = useState('');
  const [q, setQ] = useState('');
  const [sending, setSending] = useState(false);
  const [usingSupabase, setUsingSupabase] = useState(false);
  const threadRef = useRef(null);

  // Try to load from Supabase on mount
  useEffect(() => {
    loadFromSupabase();
  }, []);

  const loadFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });

      if (error || !data) return; // Fall back to mock

      // Group into conversations by guest_id
      const grouped = {};
      data.forEach(msg => {
        const key = msg.guest_id;
        if (!grouped[key]) {
          grouped[key] = {
            id: key,
            guest_id: key,
            guest: msg.guest_name || msg.guest_email?.split('@')[0] || 'Guest',
            avatar: (msg.guest_name || 'G').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
            email: msg.guest_email || '',
            phone: msg.guest_phone || '',
            apartment: msg.apartment || '',
            unread: 0,
            lastAt: new Date(msg.created_at),
            messages: [],
          };
        }
        grouped[key].messages.push(msg);
        grouped[key].lastAt = new Date(msg.created_at);
        if (!msg.from_admin) grouped[key].unread++;
      });

      const list = Object.values(grouped).sort((a, b) => b.lastAt - a.lastAt);
      if (list.length > 0) {
        setConvos(list);
        setActiveId(list[0].id);
        setUsingSupabase(true);
      }
    } catch {
      // Table doesn't exist yet — keep mock data
    }
  };

  useEffect(() => {
    if (!threadRef.current) return;
    threadRef.current.scrollTo({ top: 99999, behavior: 'smooth' });
  }, [activeId, convos]);

  const active = convos.find(c => c.id === activeId);
  const filtered = convos.filter(c =>
    c.guest.toLowerCase().includes(q.toLowerCase()) ||
    c.apartment.toLowerCase().includes(q.toLowerCase())
  );

  const selectConvo = (id) => {
    setActiveId(id);
    setConvos(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
  };

  const send = async (e) => {
    e.preventDefault();
    if (!draft.trim() || !active || sending) return;

    const newMsg = {
      id: `local-${Date.now()}`,
      from_admin: true,
      body: draft.trim(),
      created_at: new Date(),
    };

    // Optimistic update
    setConvos(prev => prev.map(c =>
      c.id === activeId
        ? { ...c, messages: [...c.messages, newMsg], lastAt: new Date() }
        : c
    ));
    setDraft('');

    if (usingSupabase) {
      setSending(true);
      try {
        await supabase.from('messages').insert({
          guest_id: active.guest_id,
          guest_name: active.guest,
          guest_email: active.email,
          apartment: active.apartment,
          from_admin: true,
          body: newMsg.body,
        });
      } catch {
        // Already shown optimistically — fine
      } finally {
        setSending(false);
      }
    }
  };

  return (
    <div className="ad-messages-page">
      <header className="ad-page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <div>
            <span className="ad-eyebrow">MESSAGES</span>
            <h1 style={{ margin: 0 }}>Messages</h1>
            <p className="ad-lead">Reply to guest enquiries. Guests see your replies instantly.</p>
          </div>
          {!usingSupabase && (
            <div className="ad-setup-notice">
              <strong>Set up the messages table</strong> to enable real guest ↔ admin messaging.{' '}
              <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">
                Open Supabase →
              </a>
              <div style={{ marginTop: 6, fontSize: 12 }}>
                Run the SQL in <code>src/pages/admin/AdminMessages.jsx</code> (top of file) in your SQL Editor.
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="ad-messages">
        {/* Left: list */}
        <aside className="ad-msg-list">
          <div className="ad-msg-search">
            <Search size={13} />
            <input
              type="text" placeholder="Search guests…"
              value={q} onChange={e => setQ(e.target.value)}
            />
            <button
              title="Refresh"
              onClick={loadFromSupabase}
              style={{ background: 'none', border: 0, cursor: 'pointer', color: '#9aa19d', display: 'flex' }}
            >
              <RefreshCw size={13} />
            </button>
          </div>

          {filtered.length === 0 && <div className="ad-empty"><p>No conversations.</p></div>}

          {filtered.map(c => (
            <button
              key={c.id}
              className={`ad-msg-item${c.id === activeId ? ' active' : ''}`}
              onClick={() => selectConvo(c.id)}
            >
              <div className="ad-msg-avatar">{c.avatar}</div>
              <div className="ad-msg-body">
                <div className="ad-msg-top">
                  <span className="ad-msg-name">{c.guest}</span>
                  <span className="ad-msg-time">{formatDistanceToNow(c.lastAt, { addSuffix: false })}</span>
                </div>
                <div className="ad-msg-sub">{c.apartment}</div>
                <div className="ad-msg-preview">{c.messages[c.messages.length - 1]?.body}</div>
              </div>
              {c.unread > 0 && <span className="ad-msg-unread">{c.unread}</span>}
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
                <div className="ad-msg-avatar">{active.avatar}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ad-msg-name">{active.guest}</div>
                  <div className="ad-msg-sub">{active.apartment}{active.email ? ` · ${active.email}` : ''}</div>
                </div>
                <div className="ad-msg-head-actions">
                  {active.email && (
                    <a
                      href={`mailto:${active.email}?subject=${encodeURIComponent('Re: Your stay — Home-Office Apartments')}`}
                      className="ad-btn ad-btn-outline ad-btn-sm"
                    >
                      <Mail size={13} /> Email
                    </a>
                  )}
                  {active.phone && (
                    <a href={`tel:${active.phone}`} className="ad-btn ad-btn-outline ad-btn-sm">
                      <Phone size={13} /> Call
                    </a>
                  )}
                </div>
              </div>

              <div className="ad-msg-thread" ref={threadRef}>
                {active.messages.map((m, i) => (
                  <div key={m.id || i} className={`ad-msg-bubble ${m.from_admin ? 'me' : 'them'}`}>
                    <div>{m.body}</div>
                    <div className="ad-msg-at">
                      {m.from_admin ? 'You · ' : `${active.guest.split(' ')[0]} · `}
                      {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                    </div>
                  </div>
                ))}
              </div>

              <form className="ad-msg-composer" onSubmit={send}>
                <input
                  type="text"
                  placeholder={`Reply to ${active.guest.split(' ')[0]}…`}
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
