/**
 * Fix Login Admin — Step 4: Cek & Reset Password
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
  console.log('=== Fix Login Admin — Step 4: Cek & Reset Password ===\n');

  try {
    // Step 1: Cek password hash yang tersimpan
    console.log('Step 1: Cek password hash yang tersimpan...');
    const admins = await runSql(`
      SELECT id, email, name, password, LENGTH(password) as pwd_len 
      FROM public."Admin"
    `);
    console.log('Admin users:');
    for (const admin of admins) {
      console.log(`  Email: ${admin.email}`);
      console.log(`  Name: ${admin.name}`);
      console.log(`  Password hash: ${admin.password}`);
      console.log(`  Hash length: ${admin.pwd_len}`);
      console.log('');
    }

    // Step 2: Test apakah hash cocok dengan 'password123'
    console.log('Step 2: Test crypt() langsung...');
    const cryptTest = await runSql(`
      SELECT 
        email,
        password as stored_hash,
        extensions.crypt('password123', password) as computed_hash,
        (password = extensions.crypt('password123', password)) as matches
      FROM public."Admin"
    `);
    console.log('crypt() test results:');
    for (const row of cryptTest) {
      console.log(`  Email: ${row.email}`);
      console.log(`  Stored hash:  ${row.stored_hash}`);
      console.log(`  Computed hash: ${row.computed_hash}`);
      console.log(`  Matches: ${row.matches}`);
      console.log('');
    }

    // Step 3: Generate hash baru untuk 'password123' dan update
    console.log('Step 3: Reset password semua admin ke "password123"...');
    const newHash = await runSql(`SELECT extensions.crypt('password123', extensions.gen_salt('bf', 12)) as hash`);
    console.log('New hash:', newHash[0].hash);
    
    await runSql(`
      UPDATE public."Admin" 
      SET password = '${newHash[0].hash}',
          "updatedAt" = NOW()
    `);
    console.log('✅ All admin passwords reset to "password123"');

    // Step 4: Verifikasi update
    console.log('\nStep 4: Verifikasi password baru...');
    const verify = await runSql(`
      SELECT 
        email,
        password as stored_hash,
        extensions.crypt('password123', password) as computed_hash,
        (password = extensions.crypt('password123', password)) as matches
      FROM public."Admin"
    `);
    for (const row of verify) {
      console.log(`  Email: ${row.email} — Matches: ${row.matches}`);
    }

    // Step 5: Test function verify_admin_password
    console.log('\nStep 5: Test function verify_admin_password...');
    const testResult = await runSql(`
      SELECT * FROM verify_admin_password('mebelonline111@gmail.com', 'password123')
    `);
    console.log('Test result:', JSON.stringify(testResult, null, 2));
    
    if (testResult && testResult.length > 0) {
      console.log('\n✅✅✅ LOGIN TEST BERHASIL! ✅✅✅');
      console.log('Admin bisa login dengan:');
      console.log('  Email: mebelonline111@gmail.com');
      console.log('  Password: password123');
    } else {
      console.log('\n❌ Masih gagal');
    }

    // Step 6: Test admin kedua
    const test2 = await runSql(`
      SELECT * FROM verify_admin_password('admin@example.com', 'password123')
    `);
    if (test2 && test2.length > 0) {
      console.log('\n✅✅✅ Admin 2 juga berhasil! ✅✅✅');
      console.log('  Email: admin@example.com');
      console.log('  Password: password123');
    }

  } catch (err) {
    console.error('\n❌ Error:', err.message);
  }

  console.log('\n=== Selesai ===');
}

run();