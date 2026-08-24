import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Send, Search } from 'lucide-react';

/**
 * Messages
 * Two-pane inbox: conversations left, thread right.
 *
 * TODO(supabase): replace MOCK data + wire up real-time with:
 *   supabase.from('conversations').select('*, messages(*)').eq('user_id', user.id)
 *   supabase.channel('messages').on('postgres_changes', ..., handleNewMessage)
 */

const MOCK_CONVERSATIONS = [
  {
    id: 'c-1',
    host: {
      name: 'Kwame Boateng',
      avatar: 'KB',
      apartment: 'The North Ridge Loft',
    },
    lastMessage: 'Perfect — see you Friday. The check-in code is 4471.',
    lastAt: new Date(Date.now() - 2 * 3600000),
    unread: 0,
    messages: [
      { id: 1, from: 'host', body: 'Hi James — thanks for booking!', at: new Date(Date.now() - 26 * 3600000) },
      { id: 2, from: 'host', body: 'The apartment is ready and I\'ve stocked the fridge with breakfast basics.', at: new Date(Date.now() - 26 * 3600000 + 60000) },
      { id: 3, from: 'me', body: 'Amazing, thank you! What time can I check in?', at: new Date(Date.now() - 5 * 3600000) },
      { id: 4, from: 'host', body: 'Anytime after 2 PM. Let me know when you\'re close.', at: new Date(Date.now() - 4 * 3600000) },
      { id: 5, from: 'me', body: 'Great. I\'ll be arriving around 3.', at: new Date(Date.now() - 3 * 3600000) },
      { id: 6, from: 'host', body: 'Perfect — see you Friday. The check-in code is 4471.', at: new Date(Date.now() - 2 * 3600000) },
    ],
  },
  {
    id: 'c-2',
    host: {
      name: 'Ama Danso',
      avatar: 'AD',
      apartment: 'Garden Studio',
    },
    lastMessage: 'Would you like me to arrange airport pickup?',
    lastAt: new Date(Date.now() - 26 * 3600000),
    unread: 1,
    messages: [
      { id: 1, from: 'host', body: 'Hi James, welcome!', at: new Date(Date.now() - 48 * 3600000) },
      { id: 2, from: 'host', body: 'Would you like me to arrange airport pickup?', at: new Date(Date.now() - 26 * 3600000) },
    ],
  },
  {
    id: 'c-3',
    host: {
      name: 'Support',
      avatar: 'HO',
      apartment: 'HomeOffice team',
    },
    lastMessage: 'Your invoice for HO-YB4LN is attached.',
    lastAt: new Date(Date.now() - 6 * 86400000),
    unread: 0,
    messages: [
      { id: 1, from: 'host', body: 'Your invoice for HO-YB4LN is attached.', at: new Date(Date.now() - 6 * 86400000) },
    ],
  },
];

export default function Messages() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const threadRef = useRef(null);

  useEffect(() => {
    setConversations(MOCK_CONVERSATIONS);
    setActiveId(MOCK_CONVERSATIONS[0]?.id ?? null);
  }, []);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [activeId, conversations]);

  const active = conversations.find((c) => c.id === activeId);

  const filtered = conversations.filter((c) =>
    c.host.name.toLowerCase().includes(query.toLowerCase()) ||
    c.host.apartment.toLowerCase().includes(query.toLowerCase())
  );

  const send = (e) => {
    e.preventDefault();
    if (!draft.trim() || !active) return;
    const newMsg = {
      id: Date.now(),
      from: 'me',
      body: draft.trim(),
      at: new Date(),
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, messages: [...c.messages, newMsg], lastMessage: newMsg.body, lastAt: newMsg.at }
          : c
      )
    );
    setDraft('');
    // TODO(supabase): supabase.from('messages').insert({ conversation_id, sender_id: user.id, body })
  };

  return (
    <div className="dash-page dash-messages-page">
      <header className="dash-page-head">
        <p className="dash-eyebrow">MESSAGES</p>
        <h1>Inbox</h1>
      </header>

      <div className="dash-messages">
        {/* Left: conversation list */}
        <aside className="dash-msg-list">
          <div className="dash-msg-search">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search conversations…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {filtered.length === 0 && (
            <div className="dash-msg-empty">No conversations match.</div>
          )}

          {filtered.map((c) => (
            <button
              key={c.id}
              className={`dash-msg-item ${c.id === activeId ? 'active' : ''}`}
              onClick={() => setActiveId(c.id)}
            >
              <div className="dash-msg-avatar">{c.host.avatar}</div>
              <div className="dash-msg-item-body">
                <div className="dash-msg-item-top">
                  <span className="dash-msg-name">{c.host.name}</span>
                  <span className="dash-msg-time">
                    {formatDistanceToNow(c.lastAt, { addSuffix: false })}
                  </span>
                </div>
                <div className="dash-msg-apt">{c.host.apartment}</div>
                <div className="dash-msg-preview">{c.lastMessage}</div>
              </div>
              {c.unread > 0 && <span className="dash-msg-unread">{c.unread}</span>}
            </button>
          ))}
        </aside>

        {/* Right: thread */}
        <section className="dash-msg-thread-wrap">
          {!active ? (
            <div className="dash-empty">
              <h3>Select a conversation</h3>
              <p>Pick a message on the left to open it.</p>
            </div>
          ) : (
            <>
              <div className="dash-msg-thread-head">
                <div className="dash-msg-avatar">{active.host.avatar}</div>
                <div>
                  <div className="dash-msg-name">{active.host.name}</div>
                  <div className="dash-msg-apt">{active.host.apartment}</div>
                </div>
              </div>

              <div className="dash-msg-thread" ref={threadRef}>
                {active.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`dash-msg-bubble ${m.from === 'me' ? 'me' : 'them'}`}
                  >
                    <div className="dash-msg-body">{m.body}</div>
                    <div className="dash-msg-at">
                      {formatDistanceToNow(m.at, { addSuffix: true })}
                    </div>
                  </div>
                ))}
              </div>

              <form className="dash-msg-composer" onSubmit={send}>
                <input
                  type="text"
                  placeholder="Type a message…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button type="submit" disabled={!draft.trim()}>
                  <Send size={16} />
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
