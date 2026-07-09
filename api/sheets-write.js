import { google } from 'googleapis';

export default async function handler(req, res) {
    // Tratar requisição que não seja POST
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Método não permitido. Utilize POST.' });
    }

    const { spreadsheetUrl, sheetName, action, rowData, rowIndex } = req.body;

    if (!spreadsheetUrl) {
        return res.status(400).json({ success: false, error: 'O parâmetro spreadsheetUrl é obrigatório no corpo da requisição.' });
    }

    if (!sheetName) {
        return res.status(400).json({ success: false, error: 'O parâmetro sheetName é obrigatório.' });
    }

    if (!action || !['add', 'update'].includes(action)) {
        return res.status(400).json({ success: false, error: 'O parâmetro action deve ser "add" ou "update".' });
    }

    if (!rowData) {
        return res.status(400).json({ success: false, error: 'O parâmetro rowData é obrigatório.' });
    }

    if (action === 'update' && (rowIndex === undefined || rowIndex === null || isNaN(parseInt(rowIndex)))) {
        return res.status(400).json({ success: false, error: 'O parâmetro rowIndex é obrigatório para atualização de linhas.' });
    }

    // Regex para extrair o ID da planilha da URL do Google Sheets
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
            error: 'Serviço indisponível: as variáveis de ambiente do Google Service Account não foram configuradas.' 
        });
    }

    // Preparar os valores na ordem correta da planilha
    const rowValues = [
        rowData.modelo || "",
        rowData.ano || "",
        rowData.preco !== undefined ? parseFloat(rowData.preco) : 0,
        rowData.km !== undefined ? parseInt(rowData.km) : 0,
        rowData.status || "stock",
        rowData.imagem || "img_suv",
        rowData.hot ? 'Sim' : 'Não',
        rowData.data_olx || "",
        rowData.custo_olx !== undefined ? parseFloat(rowData.custo_olx) : "",
        rowData.leads !== undefined ? parseInt(rowData.leads) : 0
    ];

    try {
        // Inicializar autenticação JWT com permissão de Escrita (scopes: spreadsheets)
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey.replace(/\\n/g, '\n')
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets']
        });

        const sheets = google.sheets({ version: 'v4', auth });

        if (action === 'add') {
            // Append row at the end of sheet tab
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: `${sheetName}!A1`, // append starts looking from first column
                valueInputOption: 'USER_ENTERED',
                insertDataOption: 'INSERT_ROWS',
                requestBody: {
                    values: [rowValues]
                }
            });
        } else if (action === 'update') {
            // Overwrite specific row (rowIndex)
            const idx = parseInt(rowIndex);
            await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `${sheetName}!A${idx}:J${idx}`,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [rowValues]
                }
            });
        }

        return res.status(200).json({ success: true });

    } catch (error) {
        console.error(`Erro na escrita (${action}) no Google Sheets:`, error);

        let status = 500;
        let errorMessage = `Falha ao salvar os dados no Google Sheets na linha correspondente.`;

        const code = error.code || (error.response && error.response.status);
        
        if (code === 404) {
            status = 404;
            errorMessage = 'Planilha não encontrada. Verifique o ID na URL.';
        } else if (code === 403) {
            status = 403;
            errorMessage = `Acesso negado. Certifique-se de compartilhar a planilha com o e-mail da sua Conta de Serviço ("${clientEmail}") dando permissão de "Editor" (é necessário para escrita).`;
        } else if (code === 400) {
            status = 400;
            if (error.message && error.message.includes('Unable to parse range')) {
                errorMessage = `A aba "${sheetName}" não existe na planilha.`;
            } else {
                errorMessage = 'Solicitação inválida. Verifique o formato dos campos digitados.';
            }
        } else if (error.message) {
            errorMessage = `Erro retornado pelo Google: ${error.message}`;
        }

        return res.status(status).json({
            success: false,
            error: errorMessage
        });
    }
}
