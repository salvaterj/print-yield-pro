import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.0';

type Role = 'admin' | 'vendas' | 'producao';

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const role = body.role as Role;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (role !== 'admin' && role !== 'vendas' && role !== 'producao') {
      return new Response(JSON.stringify({ error: 'Invalid role' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!created?.user?.id) {
      return new Response(JSON.stringify({ error: 'User not created' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { error: profileError } = await supabaseAdmin.from('user_profiles').insert({
      id: created.user.id,
      email,
      role,
      active: true,
    });

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: created.user.id }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ error: 'Unexpected error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});

