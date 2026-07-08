/**
 * Fix Login Admin — Step 3: Fix pgcrypto schema
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
  console.log('=== Fix Login Admin — Step 3: Fix pgcrypto schema ===\n');

  try {
    // Step 1: Cek schema pgcrypto
    console.log('Step 1: Cek schema pgcrypto...');
    const extInfo = await runSql(`
      SELECT e.extname, n.nspname as schema_name 
      FROM pg_extension e 
      JOIN pg_namespace n ON e.extnamespace = n.oid 
      WHERE e.extname = 'pgcrypto'
    `);
    console.log('pgcrypto schema:', JSON.stringify(extInfo));

    // Step 2: Cek semua function crypt di semua schema
    console.log('\nStep 2: Cari function crypt() di semua schema...');
    const cryptFuncs = await runSql(`
      SELECT n.nspname as schema_name, p.proname, 
             pg_get_function_arguments(p.oid) as args
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.proname = 'crypt'
    `);
    console.log('crypt() functions:', JSON.stringify(cryptFuncs));

    // Step 3: Cek search_path saat ini
    console.log('\nStep 3: Cek search_path...');
    const searchPath = await runSql(`SHOW search_path`);
    console.log('search_path:', JSON.stringify(searchPath));

    // Step 4: Drop function lama
    console.log('\nStep 4: Drop function lama...');
    await runSql(`DROP FUNCTION IF EXISTS public.verify_admin_password(text, text) CASCADE`);
    console.log('✅ Dropped');

    // Step 5: Buat function baru dengan schema yang benar
    // pgcrypto di Supabase biasanya di schema 'extensions' atau 'public'
    const pgcryptoSchema = extInfo[0]?.schema_name || 'public';
    console.log(`\nStep 5: Create function dengan schema pgcrypto: ${pgcryptoSchema}...`);
    
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
      SET search_path = 'public, ${pgcryptoSchema}'
      AS $$
      BEGIN
        RETURN QUERY
        SELECT a.id::TEXT, a.email, a.name
        FROM public."Admin" a
        WHERE LOWER(a.email) = LOWER(p_email)
          AND a.password = ${pgcryptoSchema}.crypt(p_password, a.password);
      END;
      $$;
    `);
    console.log(`✅ Created function with ${pgcryptoSchema}.crypt()`);

    // Step 6: Grant permissions
    console.log('\nStep 6: Grant permissions...');
    await runSql(`GRANT EXECUTE ON FUNCTION public.verify_admin_password(text, text) TO service_role`);
    await runSql(`REVOKE EXECUTE ON FUNCTION public.verify_admin_password(text, text) FROM anon, authenticated`);
    console.log('✅ Permissions set');

    // Step 7: Test function
    console.log('\nStep 7: Test function...');
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
      }
    }

  } catch (err) {
    console.error('\n❌ Error:', err.message);
  }

  console.log('\n=== Selesai ===');
}

run();