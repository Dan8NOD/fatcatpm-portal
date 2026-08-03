export const metadata = { title: 'FatCat PM — Owner Portal' };

const brokerBarStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '10px 24px',
  background: '#0a0a0c',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0a0a0c', color: '#f4f1ea', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <a
          href="https://westward360.com"
          target="_blank"
          rel="noopener"
          className="no-print"
          style={{ ...brokerBarStyle, borderBottom: '1px solid #26262e', textDecoration: 'none', color: 'inherit' }}
        >
          <img src="/westward360-logo.svg" alt="Westward360" style={{ height: 32, width: 'auto' }} />
          <span style={{ fontSize: 12, letterSpacing: '.06em', color: '#8e8a7d' }}>Licensed under Westward360</span>
        </a>
        {children}
        <footer
          className="no-print"
          style={{ ...brokerBarStyle, borderTop: '1px solid #26262e' }}
        >
          <a href="https://westward360.com" target="_blank" rel="noopener" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
            <img src="/westward360-logo.svg" alt="Westward360" style={{ height: 28, width: 'auto' }} />
            <span style={{ fontSize: 11, color: '#8e8a7d' }}>FatCat PM operates under Westward360 · westward360.com</span>
          </a>
        </footer>
      </body>
    </html>
  );
}
