import { useState, useRef, useEffect } from 'react';
import { Send, Search, Mail, Phone } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

/**
 * AdminMessages
 * Two-pane inbox. Admin (green bubbles right) replies to guests (white left).
 * Click Send to fire a real email via mailto: link + record in thread.
 *
 * TODO(supabase): replace MOCK_CONVOS with real data:
 *   supabase.from('conversations').select('*, messages(*)').order('last_message_at', { ascending: false })
 */

const MOCK_CONVOS = [
  {
    id: 'c1',
    guest: 'Abena Mensah', avatar: 'AM', email: 'abena@example.com',
    phone: '+233 24 000 0001', apt: 'Verandah Apartment',
    unread: 1, lastAt: new Date(Date.now() - 30 * 60000),
    messages: [
      { id: 1, from: 'guest', body: 'Hi, I submitted an enquiry for 10–15 Oct. Just checking if the dates are available?', at: new Date(Date.now() - 30 * 60000) },
    ],
  },
  {
    id: 'c2',
    guest: 'Kofi Asante', avatar: 'KA', email: 'kofi@example.com',
    phone: '+233 20 000 0002', apt: 'Garden Apartment',
    unread: 1, lastAt: new Date(Date.now() - 2 * 3600000),
    messages: [
      { id: 1, from: 'admin', body: 'Hi Kofi, your booking is confirmed for 20–24 Oct. See you soon!', at: new Date(Date.now() - 3 * 3600000) },
      { id: 2, from: 'guest', body: 'Thank you! Will there be parking available?', at: new Date(Date.now() - 2 * 3600000) },
    ],
  },
  {
    id: 'c3',
    guest: 'Jonathan Duah', avatar: 'JD', email: 'james@example.com',
    phone: '+233 27 000 0003', apt: 'Verandah Apartment',
    unread: 0, lastAt: new Date(Date.now() - 2 * 86400000),
    messages: [
      { id: 1, from: 'guest', body: 'Just wanted to confirm check-in is still 3 PM on the 31st?', at: new Date(Date.now() - 2 * 86400000 + 3600000) },
      { id: 2, from: 'admin', body: 'Yes, 3 PM is perfect. We\'ll have everything ready for you.', at: new Date(Date.now() - 2 * 86400000) },
    ],
  },
];

export default function AdminMessages() {
  const [convos, setConvos] = useState(MOCK_CONVOS);
  const [activeId, setActiveId] = useState('c1');
  const [draft, setDraft] = useState('');
  const [q, setQ] = useState('');
  const threadRef = useRef(null);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: 99999, behavior: 'smooth' });
  }, [activeId, convos]);

  const active = convos.find(c => c.id === activeId);

  const filtered = convos.filter(c =>
    c.guest.toLowerCase().includes(q.toLowerCase()) ||
    c.apt.toLowerCase().includes(q.toLowerCase())
  );

  const selectConvo = (id) => {
    setActiveId(id);
    setConvos(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
  };

  const send = (e) => {
    e.preventDefault();
    if (!draft.trim() || !active) return;
    const msg = { id: Date.now(), from: 'admin', body: draft.trim(), at: new Date() };
    setConvos(prev => prev.map(c =>
      c.id === activeId
        ? { ...c, messages: [...c.messages, msg], lastAt: new Date(), unread: 0 }
        : c
    ));
    setDraft('');
    // TODO(supabase): insert message into DB and trigger email notification
  };

  const mailtoReply = () => {
    if (!active) return;
    const subject = encodeURIComponent(`Re: Your stay at ${active.apt} — Home-Office Apartments`);
    const body = encodeURIComponent(`Hi ${active.guest.split(' ')[0]},\n\n`);
    window.location.href = `mailto:${active.email}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="ad-messages-page">
      <header className="ad-page-head">
        <span className="ad-eyebrow">MESSAGES</span>
        <h1>Messages</h1>
        <p className="ad-lead">Reply to guest enquiries and booking questions.</p>
      </header>

      <div className="ad-messages">
        {/* Left: conversation list */}
        <aside className="ad-msg-list">
          <div className="ad-msg-search">
            <Search size={13}/>
            <input
              type="text" placeholder="Search guests…"
              value={q} onChange={e => setQ(e.target.value)}
            />
          </div>

          {filtered.length === 0 && (
            <div className="ad-empty"><p>No conversations found.</p></div>
          )}

          {filtered.map(c => (
            <button key={c.id}
              className={`ad-msg-item ${c.id === activeId ? 'active' : ''}`}
              onClick={() => selectConvo(c.id)}>
              <div className="ad-msg-avatar">{c.avatar}</div>
              <div className="ad-msg-body">
                <div className="ad-msg-top">
                  <span className="ad-msg-name">{c.guest}</span>
                  <span className="ad-msg-time">{formatDistanceToNow(c.lastAt, { addSuffix: false })}</span>
                </div>
                <div className="ad-msg-sub">{c.apt}</div>
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
                  <div className="ad-msg-sub">{active.apt}</div>
                </div>
                <div className="ad-msg-head-actions">
                  <a href={`mailto:${active.email}?subject=${encodeURIComponent('Re: Your stay — Home-Office Apartments')}`}
                    className="ad-btn ad-btn-outline ad-btn-sm" title={active.email}>
                    <Mail size={13}/> Email
                  </a>
                  {active.phone && (
                    <a href={`tel:${active.phone}`}
                      className="ad-btn ad-btn-outline ad-btn-sm" title={active.phone}>
                      <Phone size={13}/> Call
                    </a>
                  )}
                </div>
              </div>

              <div className="ad-msg-thread" ref={threadRef}>
                {active.messages.map(m => (
                  <div key={m.id} className={`ad-msg-bubble ${m.from === 'admin' ? 'me' : 'them'}`}>
                    <div>{m.body}</div>
                    <div className="ad-msg-at">{formatDistanceToNow(m.at, { addSuffix: true })}</div>
                  </div>
                ))}
              </div>

              <form className="ad-msg-composer" onSubmit={send}>
                <input
                  type="text"
                  placeholder={`Reply to ${active.guest.split(' ')[0]}…`}
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                />
                <button type="submit" disabled={!draft.trim()} title="Send reply">
                  <Send size={15}/>
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
