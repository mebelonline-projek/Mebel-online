/**
 * Fix Login Admin — Step 2: Enable pgcrypto & fix function
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
  console.log('=== Fix Login Admin — Step 2 ===\n');

  try {
    // Step 1: Enable pgcrypto extension
    console.log('Step 1: Enable pgcrypto extension...');
    await runSql(`CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public`);
    console.log('✅ pgcrypto enabled');

    // Step 2: Cek apakah pgcrypto aktif
    console.log('\nStep 2: Verify pgcrypto...');
    const extCheck = await runSql(`
      SELECT extname, extversion FROM pg_extension WHERE extname = 'pgcrypto'
    `);
    console.log('pgcrypto:', JSON.stringify(extCheck));

    // Step 3: Drop function lama
    console.log('\nStep 3: Drop function lama...');
    await runSql(`DROP FUNCTION IF EXISTS public.verify_admin_password(text, text) CASCADE`);
    console.log('✅ Dropped');

    // Step 4: Create function baru dengan search_path yang benar
    console.log('\nStep 4: Create function baru dengan pgcrypto...');
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
      SET search_path = 'public'
      AS $$
      BEGIN
        RETURN QUERY
        SELECT a.id::TEXT, a.email, a.name
        FROM public."Admin" a
        WHERE LOWER(a.email) = LOWER(p_email)
          AND a.password = public.crypt(p_password, a.password);
      END;
      $$;
    `);
    console.log('✅ Created function with public.crypt()');

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
      console.log('\n❌ Test result kosong — password mungkin salah');
      console.log('Mencoba admin kedua...');
      const test2 = await runSql(`
        SELECT * FROM verify_admin_password('admin@example.com', 'password123')
      `);
      console.log('Test result 2:', JSON.stringify(test2, null, 2));
      if (test2 && test2.length > 0) {
        console.log('\n✅✅✅ LOGIN TEST BERHASIL (admin 2)! ✅✅✅');
      } else {
        console.log('\n❌ Kedua admin gagal login');
        console.log('Cek password hash di database...');
        const pwdCheck = await runSql(`
          SELECT email, LEFT(password, 10) as pwd_prefix, LENGTH(password) as pwd_len FROM public."Admin"
        `);
        console.log('Password hashes:', JSON.stringify(pwdCheck, null, 2));
      }
    }

    // Step 7: Test get_dashboard_stats
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