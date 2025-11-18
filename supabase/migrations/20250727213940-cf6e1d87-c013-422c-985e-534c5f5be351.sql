-- Corrigir os working_hours para usar o member_id correto ao invés do user_id

-- Primeiro, vamos atualizar os registros existentes para usar o member_id correto
UPDATE working_hours 
SET member_id = om.id
FROM organization_members om
WHERE working_hours.member_id = om.user_id 
  AND working_hours.organization_id = om.organization_id
  AND om.status = 'active';

-- Verificar se a atualização funcionou
SELECT 
  wh.member_id,
  wh.organization_id,
  om.id as correct_member_id,
  om.user_id,
  p.display_name
FROM working_hours wh
JOIN organization_members om ON wh.member_id = om.id
JOIN profiles p ON om.user_id = p.user_id
WHERE wh.is_active = true;