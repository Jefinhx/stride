export const metadata = {
  title: 'Stride 2.0',
  description: 'Performance de Elite',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
      </head>
      <body 
        suppressHydrationWarning={true} 
        style={{ margin: 0, padding: 0, boxSizing: 'border-box' }} // <--- O TIRO DE MISERICÓRDIA ESTÁ AQUI
      >
        {children}
      </body>
    </html>
  )
}
