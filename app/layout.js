import React from 'react';

export const metadata = {
  title: 'Stride 2.0',
  description: 'Sincronize seus treinos',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body>
        {children}
      </body>
    </html>
  );
}
