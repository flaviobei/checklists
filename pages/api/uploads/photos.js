import fs from 'fs';
import path from 'path';
import { IncomingForm } from 'formidable';

// Desabilitar o bodyParser padrão do Next.js para permitir upload de arquivos
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido' });
  }

  // Criar pasta de uploads se não existir
  const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'checklist-photos');
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Configurar o formidable
  const form = new IncomingForm({
    uploadDir,
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Erro ao processar upload:', err);
        res.status(500).json({ message: 'Erro ao processar upload: ' + err.message });
        return resolve();
      }

      try {
        // Obter informações do arquivo
        const file = files.photo?.[0]; // Formidable v2 retorna arrays
        
        if (!file) {
          res.status(400).json({ message: 'Nenhum arquivo enviado' });
          return resolve();
        }

        // Extrair informações dos campos
        const checklistId = fields.checklistId?.[0] || 'unknown';
        const itemId = fields.itemId?.[0] || 'unknown';

        // Gerar nome de arquivo único
        const timestamp = Date.now();
        const fileExt = path.extname(file.originalFilename || '.jpg');
        const fileName = `${checklistId}_${itemId}_${timestamp}${fileExt}`;
        
        // Caminho final do arquivo
        const finalPath = path.join(uploadDir, fileName);
        
        // Renomear o arquivo para o nome final
        fs.renameSync(file.filepath, finalPath);
        
        // Caminho relativo para acesso via URL
        const relativePath = `/uploads/checklist-photos/${fileName}`;
        
        // Retornar o caminho do arquivo salvo
        res.status(200).json({ 
          message: 'Arquivo enviado com sucesso',
          filePath: relativePath
        });
        return resolve();
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        res.status(500).json({ message: 'Erro ao processar arquivo: ' + error.message });
        return resolve();
      }
    });
  });
}