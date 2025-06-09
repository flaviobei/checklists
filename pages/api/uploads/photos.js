import fs from 'fs';
import path from 'path';
import formidable from 'formidable';

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

  try {
    // Criar pasta de uploads se não existir
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'checklist-photos');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Configurar o formidable para processar o upload
    const form = new formidable.IncomingForm({
      uploadDir,
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    // Processar o upload
    form.parse(req, (err, fields, files) => {
      if (err) {
        console.error('Erro ao processar upload:', err);
        return res.status(500).json({ message: 'Erro ao processar upload' });
      }

      // Obter informações do arquivo
      const file = files.photo;
      if (!file) {
        return res.status(400).json({ message: 'Nenhum arquivo enviado' });
      }

      // Gerar nome de arquivo único baseado no checklistId, itemId e timestamp
      const { checklistId, itemId } = fields;
      const timestamp = Date.now();
      const fileExt = path.extname(file.originalFilename || file.filepath);
      const fileName = `${checklistId}_${itemId}_${timestamp}${fileExt}`;
      
      // Caminho final do arquivo
      const finalPath = path.join(uploadDir, fileName);
      
      // Renomear o arquivo para o nome final
      fs.renameSync(file.filepath, finalPath);
      
      // Caminho relativo para acesso via URL
      const relativePath = `/uploads/checklist-photos/${fileName}`;
      
      // Retornar o caminho do arquivo salvo
      return res.status(200).json({ 
        message: 'Arquivo enviado com sucesso',
        filePath: relativePath
      });
    });
  } catch (error) {
    console.error('Erro ao salvar foto:', error);
    return res.status(500).json({ message: 'Erro ao salvar foto' });
  }
}
