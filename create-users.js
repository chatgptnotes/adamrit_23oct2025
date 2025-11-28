/**
 * Script to create user accounts with hashed passwords
 * Run with: node create-users.js
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Supabase configuration (from your client.ts)
const supabaseUrl = 'https://xvkxccqaopbnkvwgyfjv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh2a3hjY3Fhb3Bibmt2d2d5Zmp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MjMwMTIsImV4cCI6MjA2MzM5OTAxMn0.z9UkKHDm4RPMs_2IIzEPEYzd3-sbQSF6XpxaQg3vZhU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUserAccounts() {
  console.log('🔐 Hashing passwords...');

  // Hash passwords with bcrypt (salt rounds: 12)
  const hopePassword = await bcrypt.hash('Hope@2025', 12);
  const ayushmanPassword = await bcrypt.hash('Ayushman@2025', 12);

  console.log('✅ Passwords hashed successfully');
  console.log('');

  // Create Hope Hospital User
  console.log('📝 Creating Hope Hospital user...');
  const { data: hopeUser, error: hopeError } = await supabase
    .from('User')
    .insert({
      email: 'user@hopehospital.com',
      password: hopePassword,
      role: 'user',
      hospital_type: 'hope'
    })
    .select()
    .single();

  if (hopeError) {
    if (hopeError.code === '23505') {
      console.log('⚠️  Hope user already exists');
    } else {
      console.error('❌ Error creating Hope user:', hopeError);
    }
  } else {
    console.log('✅ Hope Hospital user created:', hopeUser.email);
  }

  // Create Ayushman Hospital User
  console.log('📝 Creating Ayushman Hospital user...');
  const { data: ayushmanUser, error: ayushmanError } = await supabase
    .from('User')
    .insert({
      email: 'user@ayushmanhospital.com',
      password: ayushmanPassword,
      role: 'user',
      hospital_type: 'ayushman'
    })
    .select()
    .single();

  if (ayushmanError) {
    if (ayushmanError.code === '23505') {
      console.log('⚠️  Ayushman user already exists');
    } else {
      console.error('❌ Error creating Ayushman user:', ayushmanError);
    }
  } else {
    console.log('✅ Ayushman Hospital user created:', ayushmanUser.email);
  }

  console.log('');
  console.log('🎉 User account creation complete!');
  console.log('');
  console.log('📋 User Accounts:');
  console.log('1. user@hopehospital.com / Hope@2025 (Hope Hospital)');
  console.log('2. user@ayushmanhospital.com / Ayushman@2025 (Ayushman Hospital)');
}

// Run the script
createUserAccounts()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
