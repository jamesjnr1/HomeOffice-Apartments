import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import StarRating from '../../components/StarRating';
import { apartmentName } from '../../lib/apartments';

/**
 * AdminReviews — every guest review, including ones hidden from the
 * public site (owner/manager RLS sees all; anon/guests only see
 * is_public = true — see supabase/migrations/20260921130000_reviews_
 * and_guest_accounts.sql). "Hide" doesn't delete a review, just pulls
 * it off the public ReviewsSection on Apartments.jsx — useful for a
 * review that's abusive or clearly not about the actual stay, without
 * destroying the record entirely.
 */

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviews();

    const sub = supabase
      .channel('admin-reviews')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews' }, loadReviews)
      .subscribe();

    return () => { supabase.removeChannel(sub); };
  }, []);

  const loadReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) setReviews(data);
    } catch {
      // A network-level failure would otherwise leave this stuck on
      // "Loading…" forever.
    } finally {
      setLoading(false);
    }
  };

  const toggleVisible = async (r) => {
    setReviews((prev) => prev.map((row) => row.id === r.id ? { ...row, is_public: !row.is_public } : row));
    await supabase.from('reviews').update({ is_public: !r.is_public }).eq('id', r.id);
  };

  return (
    <div className="mgmt-page">
      <header className="mgmt-page-head">
        <span className="mgmt-eyebrow">REVIEWS</span>
        <h1>Guest reviews</h1>
        <p className="mgmt-lead">What guests are saying — hide a review to pull it off the public site without deleting it.</p>
      </header>

      <div className="mgmt-card mgmt-card-flush">
        {loading ? (
          <div className="mgmt-empty"><p>Loading reviews…</p></div>
        ) : reviews.length === 0 ? (
          <div className="mgmt-empty"><p>No reviews yet — they show up here once a guest's stay is complete.</p></div>
        ) : (
          <div className="mgmt-table-wrap">
            <table className="mgmt-table">
              <thead>
                <tr><th>Guest</th><th>Apartment</th><th>Rating</th><th>Review</th><th>Date</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id}>
                    <td className="mgmt-td-primary">{r.guest_name}</td>
                    <td className="mgmt-td-sub">{apartmentName(r.apartment)}</td>
                    <td><StarRating value={r.rating} size={13} /></td>
                    <td className="mgmt-td-sub" style={{ maxWidth: 320 }}>{r.comment || <em>No comment</em>}</td>
                    <td className="mgmt-td-muted">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge ${r.is_public ? 'status-badge-good' : 'status-badge-neutral'}`}>
                        <span className="status-badge-icon">{r.is_public ? <Eye size={11} /> : <EyeOff size={11} />}</span>
                        {r.is_public ? 'Public' : 'Hidden'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="mgmt-btn mgmt-btn-outline mgmt-btn-sm"
                        onClick={() => toggleVisible(r)}
                        title={r.is_public ? 'Hide from public site' : 'Show on public site'}
                      >
                        {r.is_public ? <EyeOff size={14} /> : <Eye size={14} />}
                        {r.is_public ? 'Hide' : 'Show'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
