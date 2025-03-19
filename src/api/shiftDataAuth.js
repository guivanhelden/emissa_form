/**
 * Servidor Backend para obtenção do token da API ShiftData
 * 
 * Este arquivo deve ser usado em um ambiente Node.js para fazer requisições
 * servidor-para-servidor à API ShiftData, evitando problemas de CORS.
 * 
 * Exemplo de como usar este arquivo com Next.js API Routes:
 * 
 * // pages/api/auth/shiftdata-token.js
 * import { getShiftDataToken } from '../../../src/api/shiftDataAuth';
 * 
 * export default async function handler(req, res) {
 *   if (req.method !== 'POST') {
 *     return res.status(405).json({ error: 'Method not allowed' });
 *   }
 *   
 *   try {
 *     const { accessKey } = req.body;
 *     const tokenData = await getShiftDataToken(accessKey);
 *     return res.status(200).json(tokenData);
 *   } catch (error) {
 *     console.error('Erro ao obter token:', error);
 *     return res.status(500).json({ error: 'Erro ao obter token' });
 *   }
 * }
 */

const fetch = require('node-fetch');

/**
 * Obtém um token de autenticação da API ShiftData
 * @param {string} accessKey - Chave de acesso para a API
 * @returns {Promise<Object>} Dados do token (accessToken, expiration)
 */
async function getShiftDataToken(accessKey) {
  try {
    const response = await fetch('https://api.shiftgroup.com.br/api/Login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ accessKey })
    });

    if (!response.ok) {
      throw new Error(`Erro na API: ${response.status}`);
    }

    const data = await response.json();
    
    if (data && data[0] && data[0].accessToken) {
      // Retornar os dados formatados como esperado pelo frontend
      return {
        accessToken: data[0].accessToken,
        expiration: data[0].expiration
      };
    }
    
    throw new Error('Resposta da API não contém token válido');
  } catch (error) {
    console.error('Erro ao obter token:', error);
    throw error;
  }
}

module.exports = {
  getShiftDataToken
}; 