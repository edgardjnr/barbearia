-- Clean up any duplicate organizations (keep only the latest one for each user)
WITH ranked_orgs AS (
  SELECT id, owner_id, created_at,
         ROW_NUMBER() OVER (PARTITION BY owner_id ORDER BY created_at DESC) as rn
  FROM organizations
)
DELETE FROM organizations 
WHERE id IN (
  SELECT id FROM ranked_orgs WHERE rn > 1
);

-- Clean up orphaned organization_members
DELETE FROM organization_members 
WHERE organization_id NOT IN (SELECT id FROM organizations);

-- Ensure there's a valid organization_member record for each organization owner
INSERT INTO organization_members (organization_id, user_id, role, status)
SELECT o.id, o.owner_id, 'owner', 'active'
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM organization_members om 
  WHERE om.organization_id = o.id 
  AND om.user_id = o.owner_id 
  AND om.status = 'active'
)
ON CONFLICT (organization_id, user_id) DO NOTHING;