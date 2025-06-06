import { 
  findChecklistTypeById, 
  updateChecklistType, 
  deleteChecklistType 
} from '../../../lib/checklistTypes';

export default function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    const checklistType = findChecklistTypeById(id);
    if (checklistType) {
      res.status(200).json(checklistType);
    } else {
      res.status(404).json({ error: 'Checklist type not found' });
    }
  } 
  else if (req.method === 'PUT') {
    try {
      const updated = updateChecklistType(id, req.body);
      if (updated) {
        res.status(200).json(updated);
      } else {
        res.status(404).json({ error: 'Checklist type not found' });
      }
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  } 
  else if (req.method === 'DELETE') {
    const deleted = deleteChecklistType(id);
    if (deleted) {
      res.status(204).end();
    } else {
      res.status(404).json({ error: 'Checklist type not found' });
    }
  } 
  else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}