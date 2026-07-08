/**
 * Script untuk fix masalah login admin
 * Koneksi langsung ke PostgreSQL Supabase untuk menjalankan SQL fix
 * 
 * Usage: node scripts/fix-login.mjs
 */

import pg from 'pg';

// Coba pooler connection
const DIRECT_URL = 'postgresql://postgres:Mebelonline02@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1';

const client = new pg.Client({ connectionString: DIRECT_URL });

async function run() {
  console.log('=== Fix Login Admin ===\n');

  try {
    await client.connect();
    console.log('Connected to Supabase PostgreSQL\n');

    // Step 1: Cek tipe kolom di tabel Admin
    console.log('Step 1: Cek tipe kolom di tabel Admin...');
    const colResult = await client.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns 
      WHERE table_name='Admin' AND table_schema='public'
      ORDER BY ordinal_position
    `);
    console.log('Columns:');
    for (const col of colResult.rows) {
      console.log(`  ${col.column_name}: ${col.data_type} (${col.udt_name})`);
    }

    // Step 2: Cek function verify_admin_password saat ini
    console.log('\nStep 2: Cek function verify_admin_password saat ini...');
    const funcResult = await client.query(`
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc 
      WHERE proname = 'verify_admin_password'
    `);
    if (funcResult.rows.length > 0) {
      console.log('Current function definition:');
      console.log(funcResult.rows[0].definition);
    } else {
      console.log('Function verify_admin_password tidak ditemukan!');
    }

    // Step 3: Drop dan recreate function dengan tipe yang benar
    console.log('\nStep 3: Drop dan recreate function verify_admin_password...');
    
    // Drop function lama
    await client.query(`DROP FUNCTION IF EXISTS public.verify_admin_password(text, text) CASCADE`);
    console.log('Dropped old function');

    // Create function baru dengan return type TEXT (bukan UUID)
    await client.query(`
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
    console.log('Created new function with TEXT return type');

    // Step 4: Grant permissions
    console.log('\nStep 4: Grant permissions...');
    await client.query(`GRANT EXECUTE ON FUNCTION public.verify_admin_password(text, text) TO service_role`);
    await client.query(`REVOKE EXECUTE ON FUNCTION public.verify_admin_password(text, text) FROM anon, authenticated`);
    console.log('Permissions set correctly');

    // Step 5: Test function
    console.log('\nStep 5: Test function verify_admin_password...');
    const testResult = await client.query(`
      SELECT * FROM verify_admin_password('mebelonline111@gmail.com', 'password123')
    `);
    
    if (testResult.rows.length > 0) {
      console.log('✅ LOGIN TEST BERHASIL!');
      console.log('Result:', testResult.rows);
    } else {
      console.log('❌ LOGIN TEST GAGAL — tidak ada hasil');
      console.log('Mungkin password salah, cek password yang benar');
      
      // Test dengan admin kedua
      const testResult2 = await client.query(`
        SELECT * FROM verify_admin_password('admin@example.com', 'password123')
      `);
      if (testResult2.rows.length > 0) {
        console.log('✅ Login berhasil dengan admin@example.com');
        console.log('Result:', testResult2.rows);
      } else {
        console.log('❌ Login juga gagal dengan admin@example.com');
      }
    }

    // Step 6: Cek juga function get_dashboard_stats
    console.log('\nStep 6: Cek function get_dashboard_stats...');
    const dashFuncResult = await client.query(`
      SELECT pg_get_functiondef(oid) as definition
      FROM pg_proc 
      WHERE proname = 'get_dashboard_stats'
    `);
    if (dashFuncResult.rows.length > 0) {
      console.log('get_dashboard_stats function exists');
      // Test
      const dashTest = await client.query(`SELECT * FROM get_dashboard_stats()`);
      console.log('Dashboard stats:', dashTest.rows);
    } else {
      console.log('Function get_dashboard_stats tidak ditemukan');
    }

    console.log('\n=== Fix selesai! ===');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

run();