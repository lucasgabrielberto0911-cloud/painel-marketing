import { google } from 'googleapis';

export default async function handler(req, res) {
    // Tratar requisição que não seja POST
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Método não permitido. Utilize POST.' });
    }

    const { spreadsheetUrl, sheetName } = req.body;

    if (!spreadsheetUrl) {
        return res.status(400).json({ success: false, error: 'O parâmetro spreadsheetUrl é obrigatório no corpo da requisição.' });
    }

    // Regex para extrair o ID da planilha da URL do Google Sheets
    const match = spreadsheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    
    if (!match || !match[1]) {
        return res.status(400).json({ success: false, error: 'URL do Google Sheets inválida. Certifique-se de passar uma URL válida contendo o ID da planilha.' });
    }

    const spreadsheetId = match[1];
    
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

    if (!clientEmail || !privateKey) {
        return res.status(500).json({ 
            success: false, 
            error: 'Serviço indisponível: as variáveis de ambiente GOOGLE_SERVICE_ACCOUNT_EMAIL e/ou GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY não foram configuradas.' 
        });
    }

    // Define o range com base no nome opcional da aba (sheetName)
    const range = sheetName ? `${sheetName}!A1:Z100` : 'A1:Z100';

    try {
        // Inicializar autenticação JWT usando a Conta de Serviço do Google
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: privateKey.replace(/\\n/g, '\n')
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // Ler o intervalo da planilha
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range
        });

        return res.status(200).json({
            success: true,
            data: response.data.values || []
        });

    } catch (error) {
        console.error(`Erro na leitura do range "${range}" do Google Sheets:`, error);

        let status = 500;
        let errorMessage = `Falha ao ler os dados da planilha do Google Sheets (Aba: ${sheetName || 'Padrão'}).`;

        const code = error.code || (error.response && error.response.status);
        
        if (code === 404) {
            status = 404;
            errorMessage = 'Planilha não encontrada. Verifique se o ID na URL fornecida está correto.';
        } else if (code === 403) {
            status = 403;
            errorMessage = `Acesso negado. Certifique-se de compartilhar a planilha com o e-mail da sua Conta de Serviço ("${clientEmail}") dando permissão de "Leitor" (Viewer).`;
        } else if (code === 400) {
            status = 400;
            if (error.message && error.message.includes('Unable to parse range')) {
                errorMessage = `A aba "${sheetName}" não foi encontrada na planilha. Verifique se o nome está correto e se ela existe.`;
            } else {
                errorMessage = 'Solicitação inválida. O formato do ID ou o intervalo de dados especificado pode estar incorreto.';
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
