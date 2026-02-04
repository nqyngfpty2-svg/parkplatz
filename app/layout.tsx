import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Parkplatz Freigabe & Buchung",
  description: "Anonyme Parkplatz-Freigabe und Buchung ohne personenbezogene Daten."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <body>
        <div className="container">
          <header className="header">
            <h1>Parkplatz-Freigabe & Buchung</h1>
            <nav className="nav">
              <a href="/">Start</a>
              <a href="/release">Meinen Parkplatz freigeben</a>
              <a href="/cancel">Storno</a>
            </nav>
          </header>
          <main>{children}</main>
          <footer className="footer">
            <p>Keine personenbezogenen Daten gespeichert. Tokens werden gehasht.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
