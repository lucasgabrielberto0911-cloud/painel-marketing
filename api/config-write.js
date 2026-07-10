import { google } from 'googleapis';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Método não permitido. Utilize POST.' });
    }

    const { spreadsheetUrl, chave, valor } = req.body;

    if (!spreadsheetUrl) {
        return res.status(400).json({ success: false, error: 'O parâmetro spreadsheetUrl é obrigatório.' });
    }

    if (!chave) {
        return res.status(400).json({ success: false, error: 'O parâmetro chave é obrigatório.' });
    }

    const match = spreadsheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match || !match[1]) {
        return res.status(400).json({ success: false, error: 'URL do Google Sheets inválida.' });
    }

    const spreadsheetId = match[1];
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

    if (!clientEmail || !privateKey) {
        return res.status(500).json({ 
            success: false, 
            error: 'Serviço indisponível: variáveis de ambiente da Conta de Serviço não configuradas.' 
        });
    }

    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey.replace(/\\n/g, '\n')
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth });

        let rows = [];
        try {
            const readResponse = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: 'Configuracoes!A1:B100'
            });
            rows = readResponse.data.values || [];
        } catch (err) {
            // Se a aba não existir, tenta criar e inicializar
            if (err.message && err.message.includes('Unable to parse range')) {
                await sheets.spreadsheets.batchUpdate({
                    spreadsheetId,
                    requestBody: {
                        requests: [
                            {
                                addSheet: {
                                    properties: {
                                        title: 'Configuracoes'
                                    }
                                }
                            }
                        ]
                    }
                });

                // Criar cabeçalhos
                await sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: 'Configuracoes!A1:B1',
                    valueInputOption: 'USER_ENTERED',
                    requestBody: {
                        values: [['chave', 'valor']]
                    }
                });

                rows = [['chave', 'valor']];
            } else {
                throw err;
            }
        }

        // Procurar se a chave já existe para atualizar
        const headers = rows[0].map(h => h.toString().toLowerCase().trim());
        const keyIdx = headers.indexOf('chave');
        const valIdx = headers.indexOf('valor');

        let rowIndexToUpdate = -1;
        if (keyIdx !== -1 && valIdx !== -1) {
            for (let i = 1; i < rows.length; i++) {
                if (rows[i] && rows[i][keyIdx]?.toString().trim() === chave) {
                    rowIndexToUpdate = i + 1; // 1-based index
                    break;
                }
            }
        }

        if (rowIndexToUpdate !== -1) {
            // Atualizar
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `Configuracoes!A${rowIndexToUpdate}:B${rowIndexToUpdate}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [[chave, valor]]
                }
            });
        } else {
            // Adicionar no final
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Configuracoes!A1',
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                requestBody: {
                    values: [[chave, valor]]
                }
            });
        }

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error("Erro ao gravar configuração no Google Sheets:", error);
        return res.status(500).json({
            success: false,
            error: error.message || 'Falha ao salvar as configurações no Google Sheets.'
        });
    }
}
