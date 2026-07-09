export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: "Método não permitido. Use GET." });
    }

    const accessToken = process.env.META_ACCESS_TOKEN;
    const adAccountId = process.env.META_AD_ACCOUNT_ID;

    if (!accessToken || !adAccountId) {
        return res.status(400).json({
            success: false,
            error: "Configuração ausente. Defina as variáveis META_ACCESS_TOKEN e META_AD_ACCOUNT_ID no painel da Vercel."
        });
    }

    try {
        let formattedAccountId = adAccountId.trim();
        if (!formattedAccountId.startsWith('act_')) {
            formattedAccountId = `act_${formattedAccountId}`;
        }

        const url = `https://graph.facebook.com/v21.0/${formattedAccountId}/insights?fields=campaign_name,spend,impressions,clicks,actions&date_preset=last_30d&access_token=${accessToken}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok || data.error) {
            const fbError = data.error || {};
            const errorCode = fbError.code;
            const errorMsg = fbError.message || "";

            if (errorCode === 190) {
                return res.status(401).json({
                    success: false,
                    error: "Token de acesso expirado ou inválido, gere um novo token de longa duração"
                });
            }

            if (errorCode === 100 || errorCode === 273 || errorMsg.includes("Permissions")) {
                return res.status(403).json({
                    success: false,
                    error: `Erro de permissão ou Conta de Anúncios inválida (${formattedAccountId}). Verifique suas credenciais e permissões no Meta for Developers.`
                });
            }

            return res.status(response.status || 500).json({
                success: false,
                error: `Erro da API do Meta: ${errorMsg} (Código: ${errorCode})`
            });
        }

        return res.status(200).json({
            success: true,
            data: data.data || []
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            error: `Erro interno no servidor ao buscar insights: ${err.message}`
        });
    }
}
