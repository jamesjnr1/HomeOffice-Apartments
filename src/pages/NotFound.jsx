import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <section className="page-header" style={{ textAlign: 'center' }}>
      <div className="container">
        <p className="eyebrow">404</p>
        <h1>This page has wandered off.</h1>
        <p className="lead" style={{ margin: '0 auto 32px' }}>
          The link may be broken, or the page may have moved.
        </p>
        <Link to="/" className="btn btn-primary btn-lg">Back to home</Link>
      </div>
    </section>
  );
}
