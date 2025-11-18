-- 1) Replace RLS on Mensagens with org-aware, master-friendly policies
DROP POLICY IF EXISTS "Organization members can access messages" ON "Mensagens";
DROP POLICY IF EXISTS "Authenticated users can access all messages" ON "Mensagens";

-- Enable RLS if not already (safe)
ALTER TABLE "Mensagens" ENABLE ROW LEVEL SECURITY;

-- SELECT: Members see their org messages; masters see all
CREATE POLICY "Members can view messages in their org or masters"
ON "Mensagens"
FOR SELECT
TO authenticated
USING (
  is_master_user() OR organization_id = get_user_organization_id()
);

-- INSERT: Must write into their org (or master)
CREATE POLICY "Members can insert messages in their org"
ON "Mensagens"
FOR INSERT
TO authenticated
WITH CHECK (
  is_master_user() OR organization_id = get_user_organization_id()
);

-- UPDATE: Can update only their org rows (or master)
CREATE POLICY "Members can update messages in their org"
ON "Mensagens"
FOR UPDATE
TO authenticated
USING (
  is_master_user() OR organization_id = get_user_organization_id()
)
WITH CHECK (
  is_master_user() OR organization_id = get_user_organization_id()
);

-- DELETE: Can delete only their org rows (or master)
CREATE POLICY "Members can delete messages in their org"
ON "Mensagens"
FOR DELETE
TO authenticated
USING (
  is_master_user() OR organization_id = get_user_organization_id()
);

-- 2) Backfill organization_id using organizations.whatsapp_instance_name
UPDATE "Mensagens" m
SET organization_id = o.id
FROM organizations o
WHERE m.organization_id IS NULL
  AND m."Instancia" IS NOT NULL
  AND o.whatsapp_instance_name = m."Instancia";

-- 3) Performance index for frequent reads
CREATE INDEX IF NOT EXISTS idx_mensagens_org_created_at ON "Mensagens" (organization_id, created_at DESC);