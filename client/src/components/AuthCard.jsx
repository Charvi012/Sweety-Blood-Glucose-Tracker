export default function AuthCard({ title, children, footer }) {
  return (
    <main className="auth-page">
      <div className="auth-card">
        <h1 className="brand brand-large">Sweety - Blood Glucose Tracker</h1>
        <h2>{title}</h2>
        {children}
        <p className="auth-footer">{footer}</p>
      </div>
    </main>
  );
}
