import './globals.css';

export const metadata = {
  title: 'WiFi-ID - Sistem Pembayaran WiFi',
  description: 'Pencatatan pembayaran WiFi bulanan mandiri dan aman.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        {children}
      </body>
    </html>
  );
}
