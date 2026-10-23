// AdminRevenue.jsx — owner-only monthly Performance page: occupancy,
// revenue, rates, arrivals and demand for any month, compared with the
// month before, plus a 12-month history. Every figure is computed live
// from the raw rows (bookings, synced Airbnb/Booking.com calendar
// blocks, enquiries, site visits) by src/lib/performance.js — see that
// file for exactly how each number is counted. Kept current via a
// realtime subscription, same pattern as the other admin pages.
import { useOutletContext, Navigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft, ChevronRight, PieChart, BedDouble, CircleDollarSign, Wallet,
  Tag, TrendingUp, LogIn, Moon,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { APARTMENTS } from '../../lib/apartments';
import { UNITS, buildNightMap, monthMetrics, change } from '../../lib/performance';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const ghs = (n) => `GHS ${Math.round(n || 0).toLocaleString()}`;
const pct = (n) => `${Math.round((n || 0) * 100)}%`;
const oneDp = (n) => (n == null ? '—' : (Math.round(n * 10) / 10).toString());
const plural = (n, word) => `${oneDp(n)} ${word}${Math.round(n * 10) / 10 === 1 ? '' : 's'}`;

// site_visits can outgrow one request (PostgREST returns 1,000 rows at
// a time), so page through it.
async function loadVisits(since) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('site_visits')
      .select('session_id, created_at')
      .gte('created_at', since)
      .order('created_at', { ascending: true })
      .range(from, from + 999);
    if (error || !data) break;
    rows.push(...data);
    if (data.length < 1000) break;
  }
  return rows;
}

function Delta({ cur, prev, points = false }) {
  if (cur == null || prev == null) return <span className="perf-delta">No data last month</span>;
  if (points) {
    const d = Math.round((cur - prev) * 100);
    if (d === 0) return <span className="perf-delta">Same as last month</span>;
    return <span className={`perf-delta ${d > 0 ? 'up' : 'down'}`}>{d > 0 ? '▲' : '▼'} {Math.abs(d)} pts vs last month</span>;
  }
  const c = change(cur, prev);
  if (c == null) return <span className="perf-delta">{prev === 0 && cur > 0 ? 'Up from 0 last month' : 'No change from 0'}</span>;
  const d = Math.round(c * 100);
  if (d === 0) return <span className="perf-delta">Same as last month</span>;
  return <span className={`perf-delta ${d > 0 ? 'up' : 'down'}`}>{d > 0 ? '▲' : '▼'} {Math.abs(d)}% vs last month</span>;
}

function Stat({ icon: Icon, value, label, delta }) {
  return (
    <div className="mgmt-stat">
      <Icon size={22} strokeWidth={1.75} className="mgmt-stat-icon" />
      <div className="mgmt-stat-value">{value}</div>
      <div className="mgmt-stat-label">{label}</div>
      {delta}
    </div>
  );
}

export default function AdminRevenue() {
  const { isOwner } = useOutletContext();
  const now = new Date();
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() });
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!isOwner) return undefined;
    const since = new Date(Date.UTC(now.getFullYear() - 2, 0, 1)).toISOString();
    const load = async () => {
      const [bookings, blocks, enquiries, visits] = await Promise.all([
        supabase.from('bookings').select('id, apartment, status, check_in, check_out, total, paid_at, payment_method, created_at'),
        supabase.from('external_calendar_blocks').select('source, summary, start_date, end_date'),
        supabase.from('enquiries').select('created_at, status'),
        loadVisits(since),
      ]);
      setData({
        bookings: bookings.data || [],
        blocks: blocks.data || [],
        enquiries: enquiries.data || [],
        visits,
      });
    };
    load();
    const sub = supabase
      .channel('admin-performance')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'external_calendar_blocks' }, load)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner]);

  const nightMap = useMemo(() => (data ? buildNightMap(data.bookings, data.blocks) : null), [data]);

  const { cur, prev, history } = useMemo(() => {
    if (!data) return {};
    const at = (y, m) => monthMetrics(y, m, data, nightMap);
    const back = (y, m, n) => { const d = new Date(y, m - n, 1); return [d.getFullYear(), d.getMonth()]; };
    const hist = [];
    for (let i = 11; i >= 0; i--) {
      const [y, m] = back(cursor.y, cursor.m, i);
      hist.push({ y, m, ...at(y, m) });
    }
    return { cur: hist[11], prev: hist[10], history: hist };
  }, [data, nightMap, cursor]);

  if (!isOwner) return <Navigate to="/admin" replace />;

  const step = (n) => setCursor(({ y, m }) => { const d = new Date(y, m + n, 1); return { y: d.getFullYear(), m: d.getMonth() }; });
  const title = `${MONTHS[cursor.m]} ${cursor.y}`;
  const maxOcc = history ? Math.max(...history.map((h) => h.occupancy), 0.01) : 1;
  // The table skips the months before there was any data at all (before
  // the site and calendar sync went live), newest first.
  const hasData = (h) => h.nights.occupied || h.nights.blocked || h.earned || h.received || h.enquiries || h.visitors;
  const firstWithData = history ? history.findIndex(hasData) : -1;
  const tableRows = history ? history.slice(firstWithData === -1 ? 11 : Math.min(firstWithData, 11)).reverse() : [];

  return (
    <div className="mgmt-page">
      <header className="mgmt-page-head perf-head">
        <div>
          <span className="mgmt-eyebrow">PERFORMANCE</span>
          <h1>Monthly performance</h1>
          <p className="mgmt-lead">Both apartments, all channels — compared with the month before.</p>
        </div>
        <div className="perf-month">
          <button type="button" onClick={() => step(-1)} aria-label="Previous month"><ChevronLeft size={18} /></button>
          <span>{title}</span>
          <button type="button" onClick={() => step(1)} aria-label="Next month"><ChevronRight size={18} /></button>
        </div>
      </header>

      {!cur ? (
        <div className="mgmt-card"><p className="mgmt-lead">Loading…</p></div>
      ) : (
        <>
          <div className="mgmt-stat-grid perf-stats">
            <Stat icon={PieChart} value={pct(cur.occupancy)} label="Occupancy" delta={<Delta cur={cur.occupancy} prev={prev.occupancy} points />} />
            <Stat icon={BedDouble} value={`${cur.nights.occupied} / ${cur.nights.available}`} label="Nights booked (both apartments)" delta={<Delta cur={cur.nights.occupied} prev={prev.nights.occupied} />} />
            <Stat icon={CircleDollarSign} value={ghs(cur.earned)} label="Direct revenue earned (stays this month)" delta={<Delta cur={cur.earned} prev={prev.earned} />} />
            <Stat icon={Wallet} value={ghs(cur.received)} label="Payments received this month" delta={<Delta cur={cur.received} prev={prev.received} />} />
            <Stat icon={Tag} value={cur.adr == null ? '—' : ghs(cur.adr)} label="Average nightly rate (direct)" delta={<Delta cur={cur.adr} prev={prev.adr} />} />
            <Stat icon={TrendingUp} value={ghs(cur.revpar)} label="Direct revenue per available night" delta={<Delta cur={cur.revpar} prev={prev.revpar} />} />
            <Stat icon={LogIn} value={cur.arrivalsTotal} label="Arrivals (stays starting this month)" delta={<Delta cur={cur.arrivalsTotal} prev={prev.arrivalsTotal} />} />
            <Stat icon={Moon} value={cur.avgStay == null ? '—' : plural(cur.avgStay, 'night')} label="Average length of stay" delta={<Delta cur={cur.avgStay} prev={prev.avgStay} />} />
          </div>

          <div className="mgmt-card perf-card">
            <h2 className="mgmt-card-h">Where the nights came from</h2>
            <p className="mgmt-card-sub">{cur.nights.available} apartment-nights in {title} ({cur.days} days × 2 apartments).</p>
            <NightsBar n={cur.nights} />
          </div>

          <div className="mgmt-card mgmt-card-flush perf-card">
            <div className="perf-card-pad"><h2 className="mgmt-card-h">By apartment</h2></div>
            <div className="mgmt-table-wrap">
              <table className="mgmt-table">
                <thead>
                  <tr><th>Apartment</th><th>Occupancy</th><th>Nights booked</th><th>Direct</th><th>Airbnb</th><th>Booking.com</th><th>Blocked</th><th>Direct revenue</th></tr>
                </thead>
                <tbody>
                  {UNITS.map((u) => {
                    const p = cur.perUnit[u];
                    return (
                      <tr key={u}>
                        <td className="mgmt-td-nowrap">{APARTMENTS[u].shortName}</td>
                        <td>{pct(p.occupancy)}</td>
                        <td>{p.occupied} / {p.available}</td>
                        <td>{p.site}</td>
                        <td>{p.airbnb}</td>
                        <td>{p.bookingcom}</td>
                        <td>{p.blocked}</td>
                        <td className="mgmt-td-nowrap">{ghs(p.revenue)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mgmt-two-col">
            <div className="mgmt-card">
              <h2 className="mgmt-card-h">Demand</h2>
              <p className="mgmt-card-sub">New activity during {title}.</p>
              <dl className="perf-list">
                <Row k="Website visitors" v={cur.visitors} prev={prev.visitors} />
                <Row k="Page views" v={cur.pageViews} prev={prev.pageViews} />
                <Row k="Enquiries" v={cur.enquiries} prev={prev.enquiries} />
                <Row k="New paid bookings (site)" v={cur.newPaidBookings} prev={prev.newPaidBookings} />
                <Row k="Checkouts started, not paid" v={cur.unpaidCheckouts} prev={prev.unpaidCheckouts} />
                <Row k="Cancellations" v={cur.cancellations} prev={prev.cancellations} />
                <Row k="Average booking lead time (site)" v={cur.avgLead == null ? '—' : plural(cur.avgLead, 'day')} />
              </dl>
            </div>
            <div className="mgmt-card">
              <h2 className="mgmt-card-h">Arrivals &amp; payments</h2>
              <p className="mgmt-card-sub">Stays starting in {title}, and money received.</p>
              <dl className="perf-list">
                <Row k="Arrivals — direct (site)" v={cur.arrivals.site} prev={prev.arrivals.site} />
                <Row k="Arrivals — Airbnb" v={cur.arrivals.airbnb} prev={prev.arrivals.airbnb} />
                <Row k="Arrivals — Booking.com" v={cur.arrivals.bookingcom} prev={prev.arrivals.bookingcom} />
                <Row k="Received via Paystack" v={ghs(cur.byMethod.paystack)} />
                <Row k="Received on site" v={ghs(cur.byMethod.on_site)} />
                <Row k="Received via Mobile Money" v={ghs(cur.byMethod.mobile_money)} />
                <Row k="Total received" v={ghs(cur.received)} strong />
              </dl>
            </div>
          </div>

          <div className="mgmt-card perf-card">
            <h2 className="mgmt-card-h">Last 12 months — occupancy</h2>
            <div className="mgmt-bar-chart perf-chart">
              {history.map((h) => (
                <button
                  key={h.key}
                  type="button"
                  className={`mgmt-bar-col perf-bar-col ${h.key === cur.key ? 'active' : ''}`}
                  onClick={() => setCursor({ y: h.y, m: h.m })}
                  title={`${MONTHS[h.m]} ${h.y}: ${pct(h.occupancy)}`}
                >
                  <div className="mgmt-bar-val">{h.occupancy > 0 ? pct(h.occupancy) : ''}</div>
                  <div className="mgmt-bar-wrap">
                    {h.occupancy > 0 && <div className="mgmt-bar" style={{ height: `${(h.occupancy / maxOcc) * 100}%` }} />}
                  </div>
                  <div className="mgmt-bar-label">{MONTHS[h.m].slice(0, 3)}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="mgmt-card mgmt-card-flush perf-card">
            <div className="perf-card-pad"><h2 className="mgmt-card-h">Month by month</h2></div>
            <div className="mgmt-table-wrap">
              <table className="mgmt-table">
                <thead>
                  <tr><th>Month</th><th>Occupancy</th><th>Nights booked</th><th>Direct revenue</th><th>Received</th><th>Avg rate</th><th>Arrivals</th><th>Enquiries</th><th>Visitors</th></tr>
                </thead>
                <tbody>
                  {tableRows.map((h) => (
                    <tr key={h.key} className={h.key === cur.key ? 'mgmt-row-current' : ''} onClick={() => setCursor({ y: h.y, m: h.m })} style={{ cursor: 'pointer' }}>
                      <td className="mgmt-td-nowrap">{MONTHS[h.m].slice(0, 3)} {h.y}</td>
                      <td>{pct(h.occupancy)}</td>
                      <td>{h.nights.occupied}</td>
                      <td className="mgmt-td-nowrap">{ghs(h.earned)}</td>
                      <td className="mgmt-td-nowrap">{ghs(h.received)}</td>
                      <td className="mgmt-td-nowrap">{h.adr == null ? '—' : ghs(h.adr)}</td>
                      <td>{h.arrivalsTotal}</td>
                      <td>{h.enquiries}</td>
                      <td>{h.visitors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="perf-notes">
            <strong>How these are counted.</strong> Each night is counted once per apartment: a paid site booking first, then an
            Airbnb reservation, then Booking.com. Airbnb “Not available” nights have no guest attached (blocked by hand, or
            imported from another calendar) — they’re shown as <em>Blocked</em> and not counted as occupied; when they overlap one
            of our own bookings, the booking counts instead. Revenue comes from site bookings only — Airbnb and Booking.com
            calendars don’t include prices. “Earned” spreads each paid stay’s total over its nights; “Received” is by payment date.
          </div>
        </>
      )}
    </div>
  );
}

function Row({ k, v, prev, strong }) {
  return (
    <div className={`perf-row ${strong ? 'strong' : ''}`}>
      <dt>{k}</dt>
      <dd>
        {v}
        {prev !== undefined && typeof v === 'number' && prev !== v && (
          <span className={`perf-row-delta ${v > prev ? 'up' : 'down'}`}>{v > prev ? '▲' : '▼'} {Math.abs(v - prev)}</span>
        )}
      </dd>
    </div>
  );
}

function NightsBar({ n }) {
  const empty = n.available - n.occupied - n.blocked;
  const parts = [
    ['Direct (site)', n.site, 'site'],
    ['Airbnb', n.airbnb, 'airbnb'],
    ['Booking.com', n.bookingcom, 'bookingcom'],
    ['Blocked (no guest)', n.blocked, 'blocked'],
    ['Empty', empty, 'empty'],
  ];
  return (
    <>
      <div className="perf-stack" role="img" aria-label={parts.map(([l, v]) => `${l}: ${v}`).join(', ')}>
        {parts.filter(([, v]) => v > 0).map(([l, v, c]) => (
          <div key={c} className={`perf-seg perf-${c}`} style={{ width: `${(v / n.available) * 100}%` }} title={`${l}: ${v}`} />
        ))}
      </div>
      <div className="perf-legend">
        {parts.map(([l, v, c]) => (
          <span key={c}><i className={`perf-${c}`} />{l} <strong>{v}</strong></span>
        ))}
      </div>
    </>
  );
}
