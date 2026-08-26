import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';

/**
 * Messages — guest's single conversation with the host.
 * Matches the real live `messages` table (flat, grouped by guest_id).
 * One thread only — no multi-conversation inbox needed on the guest side.
 */

const HOST = { name: 'Home-Office Apartments', avatar: 'HO' };

export default function Messages() {
  const { user } = useOutletContext();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const threadRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;
    loadMessages();

    const sub = supabase
      .channel(`guest-messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `guest_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages(prev => {
              if (prev.some(m => m.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(sub); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (messages.length > 0) markRead();
    threadRef.current?.scrollTo({ top: 99999, behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('guest_id', user.id)
      .order('created_at', { ascending: true });

    if (!error && data) setMessages(data);
    setLoading(false);
  };

  const markRead = async () => {
    const unread = messages.filter(m => m.from_admin && !m.read_by_guest);
    if (unread.length === 0) return;

    setMessages(prev => prev.map(m =>
      m.from_admin ? { ...m, read_by_guest: true } : m
    ));

    await supabase
      .from('messages')
      .update({ read_by_guest: true })
      .eq('guest_id', user.id)
      .eq('from_admin', true)
      .eq('read_by_guest', false);
  };

  const send = async (e) => {
    e.preventDefault();
    if (!draft.trim() || sending) return;

    const body = draft.trim();
    setDraft('');
    setSending(true);

    const { error } = await supabase.from('messages').insert({
      guest_id: user.id,
      guest_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Guest',
      guest_email: user.email,
      from_admin: false,
      body,
      read_by_guest: true,
      read_by_admin: false,
    });

    if (error) setDraft(body); // restore on failure
    setSending(false);
  };

  if (loading) {
    return (
      <div className="dash-page dash-messages-page">
        <header className="dash-page-head">
          <span className="dash-eyebrow">MESSAGES</span>
          <h1>Messages with your host</h1>
        </header>
        <div className="dash-empty"><p>Loading…</p></div>
      </div>
    );
  }

  return (
    <div className="dash-page dash-messages-page">
      <header className="dash-page-head">
        <span className="dash-eyebrow">MESSAGES</span>
        <h1>Messages with your host</h1>
      </header>

      <div className="dash-messages dash-messages-single">
        <section className="dash-msg-thread-wrap">
          <div className="dash-msg-thread-head">
            <div className="dash-msg-avatar">{HOST.avatar}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="dash-msg-name">{HOST.name}</div>
              <div className="dash-msg-apt">Usually replies within a few hours</div>
            </div>
          </div>

          <div className="dash-msg-thread" ref={threadRef}>
            {messages.length === 0 ? (
              <div className="dash-empty" style={{ margin: 'auto' }}>
                <p>No messages yet. Say hello — your host usually replies quickly.</p>
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`dash-msg-bubble ${!m.from_admin ? 'me' : 'them'}`}>
                  <div>{m.body}</div>
                  <div className="dash-msg-at">
                    {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                  </div>
                </div>
              ))
            )}
          </div>

          <form className="dash-msg-composer" onSubmit={send}>
            <input
              type="text"
              placeholder="Message your host…"
              value={draft}
              onChange={e => setDraft(e.target.value)}
              disabled={sending}
            />
            <button type="submit" disabled={!draft.trim() || sending}>
              <Send size={15} />
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
