/**
 * Reference patterns for calling backend services from Server Actions / Route Handlers.
 * Not executed at runtime — safe to import types only from here in docs.
 */

// Server Action pattern:
// const supabase = await createServerSupabaseClient();
// const user = await requireAuth();
// const result = await createCampaign(supabase, user.id, { businessId, platform: "Google", ... });

// Public API / webhook pattern:
// const supabase = createServiceRoleClient();
// const result = await createLead(supabase, { businessId, name, ... });

// Admin-only (after requireAdminUser()):
// const admin = createServiceRoleClient();
// const clients = await getAllClients(admin);

export {};
