// Supabase Edge Function: create-teacher-account
// Secure, server-side provisioning of faculty login accounts.
// NEVER exposes service_role key to the React client.
// Caller must be authenticated with role 'HOD', 'PRINCIPAL', or 'SUPER_ADMIN'.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const authHeader = req.headers.get('Authorization') ?? '';

    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration: missing Supabase credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Verify caller authentication using user client
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY') ?? '', {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callerUser }, error: userAuthError } = await userClient.auth.getUser();
    if (userAuthError || !callerUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: valid caller bearer token required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Admin client with service_role key
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller role in faculty table
    const { data: callerFaculty } = await adminClient
      .from('faculty')
      .select('roles, department_id')
      .eq('auth_user_id', callerUser.id)
      .maybeSingle();

    const callerRoles = Array.isArray(callerFaculty?.roles)
      ? callerFaculty.roles
      : typeof callerFaculty?.roles === 'string'
      ? JSON.parse(callerFaculty.roles)
      : [];

    const isAuthorized =
      callerRoles.includes('HOD') ||
      callerRoles.includes('PRINCIPAL') ||
      callerRoles.includes('SUPER_ADMIN');

    if (!isAuthorized) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: caller must be HOD, Principal, or Super Admin' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Parse request payload
    const body = await req.json();
    const {
      fullName,
      email,
      employeeId,
      departmentId,
      designation,
      roles = ['TEACHER'],
      temporaryPassword
    } = body;

    if (!fullName || !email || !departmentId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: fullName, email, departmentId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // HOD scope check: HOD can only invite for their own department
    if (callerRoles.includes('HOD') && !callerRoles.includes('PRINCIPAL') && !callerRoles.includes('SUPER_ADMIN')) {
      if (callerFaculty?.department_id && callerFaculty.department_id !== departmentId) {
        return new Response(
          JSON.stringify({ error: 'Forbidden: HOD can only enroll faculty in their own department' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const cleanEmail = email.trim().toLowerCase();
    const tempPass = temporaryPassword || `NssStaff@${Math.floor(1000 + Math.random() * 9000)}`;

    // 4. Create or fetch Auth user in Supabase Auth
    let authUserId: string;
    const { data: newAuthData, error: createAuthError } = await adminClient.auth.admin.createUser({
      email: cleanEmail,
      password: tempPass,
      email_confirm: true,
      user_metadata: {
        full_name: fullName.trim(),
        employee_id: employeeId || '',
        department_id: departmentId,
        must_change_password: true,
      },
    });

    if (createAuthError) {
      // If user already exists in auth.users, fetch their ID
      if (createAuthError.message.toLowerCase().includes('already registered')) {
        const { data: listData } = await adminClient.auth.admin.listUsers();
        const existing = listData?.users?.find(u => u.email?.toLowerCase() === cleanEmail);
        if (!existing) {
          throw createAuthError;
        }
        authUserId = existing.id;
      } else {
        throw createAuthError;
      }
    } else {
      authUserId = newAuthData.user.id;
    }

    // 5. Insert or update faculty table
    const facultyPayload = {
      auth_user_id: authUserId,
      full_name: fullName.trim(),
      email: cleanEmail,
      employee_id: employeeId || null,
      employee_code: employeeId || null,
      department_id: departmentId,
      designation: designation || 'Assistant Professor',
      roles: roles,
      is_active: true,
      status: 'ACTIVE',
      // Note: plaintext password is NEVER stored in database!
    };

    const { data: facultyRecord, error: facultyError } = await adminClient
      .from('faculty')
      .upsert(facultyPayload, { onConflict: 'email' })
      .select()
      .single();

    if (facultyError) throw facultyError;

    return new Response(
      JSON.stringify({
        success: true,
        faculty: facultyRecord,
        authUserId,
        temporaryPasswordGenerated: !temporaryPassword,
        message: 'Faculty account created. Temporary password must be changed upon first login.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
