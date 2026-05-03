import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export default function DatenschutzPage() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Datenschutz | Party Olympiade";
  }, []);

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto animate-slide-up">
        <button className="btn-ghost mb-8" onClick={() => navigate(-1)}>
          <span className="flex items-center gap-1.5">
            <ArrowLeft size={14} /> Zurück
          </span>
        </button>

        <div
          className="rounded-2xl p-8"
          style={{
            background: "rgba(12,15,35,0.8)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div className="flex items-center gap-3 mb-8">
            <ShieldCheck size={22} className="text-cyan-400" />
            <h1 className="text-2xl font-black text-white">
              Datenschutzerklärung
            </h1>
          </div>

          <div className="space-y-6 text-sm text-white/70 leading-relaxed">
            <section>
              <h2 className="text-white font-bold mb-2 text-base">
                1. Verantwortlicher
              </h2>
              <p>
                Verantwortlich für die Datenverarbeitung auf dieser Website im
                Sinne der DSGVO ist:
              </p>
              <p className="mt-2">
                Party Olympiade
                <br />
                E-Mail: party-olympiade@gmail.com
              </p>
            </section>

            <section>
              <h2 className="text-white font-bold mb-2 text-base">
                2. Welche Daten wir erheben
              </h2>
              <p className="mb-2">
                <strong className="text-white/90">
                  Sitzungsdaten (ohne Konto):
                </strong>{" "}
                Wenn du einer Lobby beitrittst, wird nur dein gewählter
                Anzeigename für die Dauer der Sitzung gespeichert. Diese Daten
                werden nach Ende der Sitzung gelöscht und nicht dauerhaft
                gespeichert.
              </p>
              <p className="mb-2">
                <strong className="text-white/90">Freiwilliges Konto:</strong>{" "}
                Wenn du ein Konto erstellst, speichern wir deinen Benutzernamen
                und deine E-Mail-Adresse. Passwörter werden ausschließlich als
                sicherer Hash (bcrypt) gespeichert.
              </p>
              <p>
                <strong className="text-white/90">Technische Daten:</strong>{" "}
                Beim Verbindungsaufbau werden temporär IP-Adressen und
                Browser-Informationen durch Standard-Webserver-Logs erfasst.
                Diese werden nicht dauerhaft gespeichert.
              </p>
            </section>

            <section>
              <h2 className="text-white font-bold mb-2 text-base">
                3. Zweck und Rechtsgrundlage
              </h2>
              <p className="mb-2">
                Die Verarbeitung deiner Daten dient ausschließlich dem Betrieb
                des Party-Olympiade-Dienstes (Echtzeit-Punktetracking und
                Lobby-Verwaltung).
              </p>
              <p>
                Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO
                (Vertragserfüllung) für Kontodaten sowie Art. 6 Abs. 1 lit. f
                DSGVO (berechtigtes Interesse) für Sitzungsdaten.
              </p>
            </section>

            <section>
              <h2 className="text-white font-bold mb-2 text-base">
                4. Datenweitergabe
              </h2>
              <p>
                Deine Daten werden nicht an Dritte weitergegeben. Die Daten
                werden auf einem eigenen Server gespeichert. Es werden keine
                Analyse- oder Werbedienste von Drittanbietern eingesetzt.
              </p>
            </section>

            <section>
              <h2 className="text-white font-bold mb-2 text-base">
                5. Speicherdauer
              </h2>
              <p>
                Sitzungsdaten werden unmittelbar nach Ende der Sitzung gelöscht.
                Kontodaten werden gespeichert, solange das Konto aktiv ist. Du
                kannst jederzeit die Löschung deines Kontos anfordern.
              </p>
            </section>

            <section>
              <h2 className="text-white font-bold mb-2 text-base">
                6. Deine Rechte
              </h2>
              <p className="mb-2">Gemäß DSGVO hast du folgende Rechte:</p>
              <ul className="list-disc list-inside space-y-1 text-white/60">
                <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
                <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
                <li>Recht auf Löschung (Art. 17 DSGVO)</li>
                <li>
                  Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)
                </li>
                <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
                <li>Widerspruchsrecht (Art. 21 DSGVO)</li>
              </ul>
              <p className="mt-2">
                Zur Ausübung dieser Rechte wende dich an:{" "}
                <a
                  href="mailto:[deine@email.de]"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  [deine@email.de]
                </a>
              </p>
            </section>

            <section>
              <h2 className="text-white font-bold mb-2 text-base">
                7. Beschwerderecht
              </h2>
              <p>
                Du hast das Recht, dich bei einer Datenschutz-Aufsichtsbehörde
                über die Verarbeitung deiner personenbezogenen Daten zu
                beschweren (Art. 77 DSGVO).
              </p>
            </section>

            <section>
              <h2 className="text-white font-bold mb-2 text-base">
                8. Cookies
              </h2>
              <p>
                Diese Website verwendet keine Tracking-Cookies. Es werden
                ausschließlich technisch notwendige Daten im localStorage des
                Browsers gespeichert (z. B. Sitzungstoken), die für die Funktion
                der Anwendung erforderlich sind.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
