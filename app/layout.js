export const metadata = {
  title: 'Stride 2.0',
  description: 'Performance de Elite',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <head>
        <style>{`
          body {
            margin: 0;
            padding: 0;
            overflow-x: hidden;
          }
        `}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
