
export const mainWindowHtml = `<!doctype html>
        <html>
          <head>
            <meta charset="UTF-8" />
            <title>Starting backend…</title>
            <style>
              body {
                margin: 0;
                height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #020617;
                color: #e5e7eb;
                font-family: system-ui, sans-serif;
              }
              .box { text-align: center; }
              h1 { margin-bottom: 0.5rem; font-size: 1.6rem; }
              p  { margin: 0.2rem 0; opacity: 0.8; }
              code {
                padding: 0.1rem 0.3rem;
                border-radius: 4px;
                background: #ffffff;
              }
            </style>
          </head>
          <body>
            <div class="box">
              <h1>Starting Docker stack…</h1>
              <p>Running <code>docker compose up -d</code> for a test web container.</p>
            </div>
          </body>
        </html>`