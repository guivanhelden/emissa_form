/**
 * Servidor proxy para requisições à API ShiftData
 * 
 * Este arquivo deve ser usado em um ambiente Node.js para encaminhar requisições
 * para a API ShiftData, evitando problemas de CORS.
 * 
 * Exemplo de como usar este arquivo com Next.js API Routes:
 * 
 * // pages/api/shiftdata/[...path].js
 * import { proxyShiftDataRequest } from '../../../src/api/shiftDataProxy';
 * 
 * export default async function handler(req, res) {
 *   await proxyShiftDataRequest(req, res);
 * }
 */

const fetch = require('node-fetch');

/**
 * Encaminha uma requisição para a API ShiftData
 * @param {Object} req - Objeto de requisição (Express/Next.js)
 * @param {Object} res - Objeto de resposta (Express/Next.js)
 */
async function proxyShiftDataRequest(req, res) {
  // Obter caminho da API a partir da URL
  // Em Next.js, isso seria algo como req.query.path ou params.path
  const path = Array.isArray(req.query.path) 
    ? req.query.path.join('/') 
    : req.url.replace(/^\/api\/shiftdata\//, '');
  
  // Construir URL completa da API
  const apiUrl = `https://api.shiftgroup.com.br/api/${path}${
    req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''
  }`;
  
  try {
    // Encaminhar a requisição para a API
    const response = await fetch(apiUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        // Encaminhar o token de autenticação, se fornecido
        ...(req.headers.authorization ? { 'Authorization': req.headers.authorization } : {})
      },
      // Encaminhar o corpo da requisição, se houver
      ...(req.method !== 'GET' && req.body ? { body: JSON.stringify(req.body) } : {})
    });
    
    // Obter dados da resposta
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    // Definir cabeçalhos da resposta
    res.status(response.status);
    
    if (contentType) {
      res.setHeader('Content-Type', contentType);
    }
    
    // Retornar dados
    if (typeof data === 'object') {
      res.json(data);
    } else {
      res.send(data);
    }
  } catch (error) {
    console.error('Erro ao encaminhar requisição:', error);
    res.status(500).json({ error: 'Erro ao processar requisição' });
  }
}

module.exports = {
  proxyShiftDataRequest
}; 