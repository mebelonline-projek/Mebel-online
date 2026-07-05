/**
 * Fix Login Admin — via Supabase Management API
 * Menjalankan SQL langsung ke database Supabase via API
 */

const PROJECT_REF = 'xczbowaotnvzduikgdad';
const PAT = process.env.SUPABASE_ACCESS_TOKEN || 'YOUR_SUPABASE_PAT_HERE';

async function runSql(query) {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAT}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }
  );
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  
  return res.json();
}

async function run() {
  console.log('=== Fix Login Admin via Supabase Management API ===\n');

  try {
    // Step 1: Cek kolom tabel Admin
    console.log('Step 1: Cek tipe kolom di tabel Admin...');
    const columns = await runSql(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name='Admin' AND table_schema='public'
      ORDER BY ordinal_position
    `);
    console.log('Columns:', JSON.stringify(columns, null, 2));

    // Step 2: Cek function saat ini
    console.log('\nStep 2: Cek function verify_admin_password...');
    try {
      const funcs = await runSql(`
        SELECT pg_get_functiondef(oid) as definition
        FROM pg_proc 
        WHERE proname = 'verify_admin_password'
      `);
      if (funcs && funcs.length > 0) {
        console.log('Current function:');
        console.log(funcs[0].definition);
      } else {
        console.log('Function tidak ditemukan');
      }
    } catch (e) {
      console.log('Error cek function:', e.message);
    }

    // Step 3: Drop function lama
    console.log('\nStep 3: Drop function lama...');
    await runSql(`DROP FUNCTION IF EXISTS public.verify_admin_password(text, text) CASCADE`);
    console.log('✅ Dropped old function');

    // Step 4: Create function baru dengan return type TEXT
    console.log('\nStep 4: Create function baru...');
    await runSql(`
      CREATE OR REPLACE FUNCTION public.verify_admin_password(
        p_email TEXT,
        p_password TEXT
      )
      RETURNS TABLE (
        id TEXT,
        email TEXT,
        name TEXT
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = 'pg_catalog', 'pg_temp', 'public'
      AS $$
      BEGIN
        RETURN QUERY
        SELECT a.id::TEXT, a.email, a.name
        FROM public."Admin" a
        WHERE LOWER(a.email) = LOWER(p_email)
          AND a.password = crypt(p_password, a.password);
      END;
      $$;
    `);
    console.log('✅ Created new function with TEXT return type');

    // Step 5: Grant permissions
    console.log('\nStep 5: Grant permissions...');
    await runSql(`GRANT EXECUTE ON FUNCTION public.verify_admin_password(text, text) TO service_role`);
    await runSql(`REVOKE EXECUTE ON FUNCTION public.verify_admin_password(text, text) FROM anon, authenticated`);
    console.log('✅ Permissions set');

    // Step 6: Test function
    console.log('\nStep 6: Test function...');
    const testResult = await runSql(`
      SELECT * FROM verify_admin_password('mebelonline111@gmail.com', 'password123')
    `);
    console.log('Test result:', JSON.stringify(testResult, null, 2));
    
    if (testResult && testResult.length > 0) {
      console.log('\n✅✅✅ LOGIN TEST BERHASIL! ✅✅✅');
    } else {
      console.log('\n❌ Test gagal — coba admin kedua...');
      const test2 = await runSql(`
        SELECT * FROM verify_admin_password('admin@example.com', 'password123')
      `);
      console.log('Test result 2:', JSON.stringify(test2, null, 2));
      if (test2 && test2.length > 0) {
        console.log('\n✅✅✅ LOGIN TEST BERHASIL (admin 2)! ✅✅✅');
      }
    }

    // Step 7: Cek get_dashboard_stats
    console.log('\nStep 7: Test get_dashboard_stats...');
    try {
      const dashResult = await runSql(`SELECT * FROM get_dashboard_stats()`);
      console.log('Dashboard stats:', JSON.stringify(dashResult, null, 2));
    } catch (e) {
      console.log('Error:', e.message);
    }

  } catch (err) {
    console.error('\n❌ Error:', err.message);
  }

  console.log('\n=== Selesai ===');
}

run();