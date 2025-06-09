/* pages/api/checklists/activeqrcodes.js 
* Rota para listar QR Codes de checklists ativos
* Permite filtrar por cliente e retorna detalhes dos checklists.
*/



import { getAllChecklists, findChecklistsByClientId } from '../../../lib/checklists';
import { getAllClients } from '../../../lib/clients';
import { getAllLocations } from '../../../lib/locations';
import { verifyToken } from '../../../lib/auth';

export default async function handler(req, res) {
  // ... (verificação de token e método)
  
  try {
    const { clientId: filterClientId } = req.query;
    let checklists;
    
    if (filterClientId) {
      checklists = findChecklistsByClientId(filterClientId);
    } else {
      checklists = getAllChecklists();
    }
    
    const activeChecklists = checklists.filter(checklist => checklist.active);
    
    const allClients = getAllClients();
    const allLocations = getAllLocations();
    
    const clientMap = allClients.reduce((map, client) => {
      map[client.id] = client.name;
      return map;
    }, {});
    
    const locationMap = allLocations.reduce((map, location) => {
      map[location.id] = location.name;
      return map;
    }, {});

    // Mapear checklists usando o campo correto: qrCodePath
    const checklistsWithDetails = activeChecklists.map(checklist => ({
      id: checklist.id,
      title: checklist.title,
      clientId: checklist.clientId,
      clientName: clientMap[checklist.clientId] || 'Cliente Desconhecido',
      locationId: checklist.locationId,
      locationName: locationMap[checklist.locationId] || 'Local Desconhecido',
      // *** Usar qrCodePath aqui ***
      qrCodeSvg: checklist.qrCodePath || null // Mapear de qrCodePath para qrCodeSvg no frontend
    }));
    
    return res.status(200).json({ checklists: checklistsWithDetails, clients: allClients });
    
  } catch (error) {
    console.error('Erro ao listar QR Codes de checklists ativos:', error);
    return res.status(500).json({ message: 'Erro ao listar QR Codes' });
  }
}