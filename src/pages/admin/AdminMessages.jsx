import { useState, useRef, useEffect } from 'react';
import { Send, Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CONVOS = [
  {
    id:'c1', guest:'Jonathan Duah', avatar:'JD', email:'james@example.com', apt:'Verandah',
    unread:1, lastAt: new Date(Date.now()-30*60000),
    messages:[
      { id:1, from:'guest', body:'Hi, just wanted to confirm my check-in time is still 3 PM?', at: new Date(Date.now()-30*60000) },
    ],
  },
  {
    id:'c2', guest:'Esi Boateng', avatar:'EB', email:'esi@example.com', apt:'Garden',
    unread:1, lastAt: new Date(Date.now()-2*3600000),
    messages:[
      { id:1, from:'admin', body:'Hi Esi, your booking is confirmed for 6–8 Sep. See you soon!', at: new Date(Date.now()-3*3600000) },
      { id:2, from:'guest', body:'Thank you! Will there be parking available?', at: new Date(Date.now()-2*3600000) },
    ],
  },
  {
    id:'c3', guest:'Abena Mensah', avatar:'AM', email:'abena@example.com', apt:'Verandah',
    unread:0, lastAt: new Date(Date.now()-2*86400000),
    messages:[
      { id:1, from:'admin', body:'Thanks for enquiring Abena. Those dates are available.', at: new Date(Date.now()-2*86400000) },
    ],
  },
];

export default function AdminMessages() {
  const [convos, setConvos] = useState(CONVOS);
  const [activeId, setActiveId] = useState('c1');
  const [draft, setDraft] = useState('');
  const [q, setQ] = useState('');
  const threadRef = useRef(null);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: 9999 });
  }, [activeId, convos]);

  const active = convos.find(c => c.id === activeId);
  const filtered = convos.filter(c =>
    c.guest.toLowerCase().includes(q.toLowerCase()) ||
    c.apt.toLowerCase().includes(q.toLowerCase())
  );

  const send = (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setConvos(prev => prev.map(c => c.id === activeId
      ? { ...c, messages: [...c.messages, { id: Date.now(), from: 'admin', body: draft.trim(), at: new Date() }], lastAt: new Date(), unread: 0 }
      : c
    ));
    setDraft('');
  };

  const selectConvo = (id) => {
    setActiveId(id);
    setConvos(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c));
  };

  return (
    <div className="ad-page ad-messages-page">
      <header className="ad-page-head">
        <span className="ad-eyebrow">MESSAGES</span>
        <h1>Messages</h1>
      </header>

      <div className="ad-messages">
        <aside className="ad-msg-list">
          <div className="ad-msg-search"><Search size={13}/><input type="text" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)}/></div>
          {filtered.map(c => (
            <button key={c.id} className={`ad-msg-item ${c.id === activeId ? 'active' : ''}`} onClick={() => selectConvo(c.id)}>
              <div className="ad-msg-avatar">{c.avatar}</div>
              <div className="ad-msg-body">
                <div className="ad-msg-top">
                  <span className="ad-msg-name">{c.guest}</span>
                  <span className="ad-msg-time">{formatDistanceToNow(c.lastAt, { addSuffix: false })}</span>
                </div>
                <div className="ad-msg-sub">{c.apt} Apartment</div>
                <div className="ad-msg-preview">{c.messages[c.messages.length-1]?.body}</div>
              </div>
              {c.unread > 0 && <span className="ad-msg-unread">{c.unread}</span>}
            </button>
          ))}
        </aside>

        <section className="ad-msg-thread-wrap">
          {!active ? <div className="ad-empty"><p>Select a conversation.</p></div> : (
            <>
              <div className="ad-msg-thread-head">
                <div className="ad-msg-avatar">{active.avatar}</div>
                <div>
                  <div className="ad-msg-name">{active.guest}</div>
                  <div className="ad-msg-sub">{active.email} · {active.apt} Apartment</div>
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
                <input type="text" placeholder="Reply to guest…" value={draft} onChange={e => setDraft(e.target.value)}/>
                <button type="submit" disabled={!draft.trim()}><Send size={15}/></button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
