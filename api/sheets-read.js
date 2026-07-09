import { google } from 'googleapis';

export default async function handler(req, res) {
    // Tratar requisição que não seja POST
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, error: 'Método não permitido. Utilize POST.' });
    }

    const { spreadsheetUrl } = req.body;

    if (!spreadsheetUrl) {
        return res.status(400).json({ success: false, error: 'O parâmetro spreadsheetUrl é obrigatório no corpo da requisição.' });
    }

    // Regex para extrair o ID da planilha da URL do Google Sheets
    // Exemplo: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0
    const match = spreadsheetUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
    
    if (!match || !match[1]) {
        return res.status(400).json({ success: false, error: 'URL do Google Sheets inválida. Certifique-se de passar uma URL válida contendo o ID da planilha.' });
    }

    const spreadsheetId = match[1];
    const apiKey = process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ 
            success: false, 
            error: 'Serviço indisponível: a variável de ambiente GOOGLE_API_KEY não foi configurada.' 
        });
    }

    try {
        // Inicializar a API do Sheets usando a API KEY para leitura pública
        const sheets = google.sheets({ version: 'v4', auth: apiKey });

        // Ler a primeira aba (A1:Z100)
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range: 'A1:Z100'
        });

        return res.status(200).json({
            success: true,
            data: response.data.values || []
        });

    } catch (error) {
        console.error('Erro na Vercel Serverless Function:', error);

        // Tratar erros comuns de forma explicativa em português
        let status = 500;
        let errorMessage = 'Falha ao ler os dados da planilha do Google Sheets.';

        // Erros do Google API vêm estruturados em error.response ou error.errors
        const code = error.code || (error.response && error.response.status);
        
        if (code === 404) {
            status = 404;
            errorMessage = 'Planilha não encontrada. Verifique se o ID na URL fornecida está correto.';
        } else if (code === 403) {
            status = 403;
            errorMessage = 'Acesso negado. Certifique-se de que a planilha está configurada como pública ("Qualquer pessoa com o link pode ler") e que a API do Google Sheets está ativa no console.';
        } else if (code === 400) {
            status = 400;
            errorMessage = 'Solicitação inválida. O formato do ID ou o intervalo de dados especificado pode estar incorreto.';
        } else if (error.message && error.message.includes('API key not valid')) {
            status = 401;
            errorMessage = 'Chave de API (GOOGLE_API_KEY) configurada é inválida ou incorreta.';
        } else if (error.message) {
            errorMessage = `Erro retornado pelo Google: ${error.message}`;
        }

        return res.status(status).json({
            success: false,
            error: errorMessage
        });
    }
}
