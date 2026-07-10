import { google } from 'googleapis';

export default async function handler(req, res) {
    const spreadsheetUrl = req.method === 'POST' ? req.body.spreadsheetUrl : req.query.spreadsheetUrl;
    const defaultConfig = { plano_olx_mensal: 672.99 };

    if (!spreadsheetUrl) {
        return res.status(200).json({ success: true, config: defaultConfig });
    }

    const match = spreadsheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) {
        return res.status(200).json({ success: true, config: defaultConfig });
    }

    const spreadsheetId = match[1];
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

    if (!clientEmail || !privateKey) {
        return res.status(200).json({ success: true, config: defaultConfig });
    }

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey.replace(/\\n/g, '\n')
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        });

        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'Configuracoes!A1:B100'
        });

        const rows = response.data.values || [];
        if (rows.length < 2) {
            return res.status(200).json({ success: true, config: defaultConfig });
        }

        const config = { ...defaultConfig };
        const headers = rows[0].map(h => h.toString().toLowerCase().trim());
        const keyIdx = headers.indexOf('chave');
        const valIdx = headers.indexOf('valor');

        if (keyIdx !== -1 && valIdx !== -1) {
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (row.length === 0) continue;
                const key = row[keyIdx]?.toString().trim();
                const valRaw = row[valIdx]?.toString().trim();
                if (key) {
                    const parsedNum = parseFloat(valRaw);
                    config[key] = isNaN(parsedNum) ? valRaw : parsedNum;
                }
            }
        }

        return res.status(200).json({ success: true, config });

    } catch (error) {
        console.error("Erro na leitura de configuracoes (Configuracoes!A1:B100):", error);
        // Fallback se a aba Configuracoes não existir ou outro erro ocorrer
        return res.status(200).json({ success: true, config: defaultConfig });
    }
}
