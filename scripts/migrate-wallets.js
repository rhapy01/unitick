#!/usr/bin/env node

/**
 * Migration Utility for Auto-Wallet System
 * 
 * This script migrates existing users to the new automatic wallet system
 * and provides utilities for managing the migration process.
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkMigrationStatus() {
  console.log('📊 Checking migration status...\n')
  
  try {
    const { data, error } = await supabase.rpc('get_migration_status')
    
    if (error) throw error
    
    const status = data[0]
    console.log('Migration Status:')
    console.log(`  Total Users: ${status.total_users}`)
    console.log(`  Users with Wallets: ${status.users_with_wallets}`)
    console.log(`  Users without Wallets: ${status.users_without_wallets}`)
    console.log(`  Migration Percentage: ${status.migration_percentage}%`)
    
    if (status.users_without_wallets === 0) {
      console.log('\n✅ All users already have wallets!')
    } else {
      console.log(`\n⚠️  ${status.users_without_wallets} users still need wallets`)
    }
    
    return status
  } catch (error) {
    console.error('❌ Error checking migration status:', error.message)
    return null
  }
}

async function migrateUsers() {
  console.log('🚀 Starting user migration to auto-wallets...\n')
  
  try {
    const { data, error } = await supabase.rpc('migrate_users_to_auto_wallets')
    
    if (error) throw error
    
    console.log(`✅ Migration completed successfully!`)
    console.log(`📈 ${data.length} users migrated`)
    
    // Show migration results
    const successCount = data.filter(r => r.migration_status === 'SUCCESS').length
    const errorCount = data.filter(r => r.migration_status.startsWith('ERROR')).length
    
    console.log(`  ✅ Successful: ${successCount}`)
    console.log(`  ❌ Errors: ${errorCount}`)
    
    if (errorCount > 0) {
      console.log('\n❌ Users with migration errors:')
      data.filter(r => r.migration_status.startsWith('ERROR')).forEach(user => {
        console.log(`  - ${user.email}: ${user.migration_status}`)
      })
    }
    
    return data
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    return null
  }
}

async function regenerateUserWallet(userId) {
  console.log(`🔄 Regenerating wallet for user: ${userId}`)
  
  try {
    const { data, error } = await supabase.rpc('regenerate_user_wallet_safe', {
      user_id: userId
    })
    
    if (error) throw error
    
    console.log(`✅ New wallet address: ${data}`)
    return data
  } catch (error) {
    console.error('❌ Error regenerating wallet:', error.message)
    return null
  }
}

async function listUsersWithoutWallets() {
  console.log('👥 Users without wallets:\n')
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, created_at')
      .is('wallet_address', null)
      .order('created_at', { ascending: true })
    
    if (error) throw error
    
    if (data.length === 0) {
      console.log('✅ All users have wallets!')
      return []
    }
    
    data.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.full_name || 'No name'})`)
      console.log(`   ID: ${user.id}`)
      console.log(`   Created: ${new Date(user.created_at).toLocaleDateString()}`)
      console.log('')
    })
    
    return data
  } catch (error) {
    console.error('❌ Error listing users:', error.message)
    return []
  }
}

async function main() {
  const command = process.argv[2]
  
  console.log('🎯 Auto-Wallet Migration Utility\n')
  
  switch (command) {
    case 'status':
      await checkMigrationStatus()
      break
      
    case 'migrate':
      const status = await checkMigrationStatus()
      if (status && status.users_without_wallets > 0) {
        console.log(`\n🚀 Migrating ${status.users_without_wallets} users...`)
        await migrateUsers()
        console.log('\n📊 Updated status:')
        await checkMigrationStatus()
      } else {
        console.log('✅ No users need migration!')
      }
      break
      
    case 'list':
      await listUsersWithoutWallets()
      break
      
    case 'regenerate':
      const userId = process.argv[3]
      if (!userId) {
        console.error('❌ Please provide a user ID')
        console.error('Usage: node migrate-wallets.js regenerate <user-id>')
        process.exit(1)
      }
      await regenerateUserWallet(userId)
      break
      
    default:
      console.log('Usage:')
      console.log('  node migrate-wallets.js status     - Check migration status')
      console.log('  node migrate-wallets.js migrate    - Migrate all users')
      console.log('  node migrate-wallets.js list       - List users without wallets')
      console.log('  node migrate-wallets.js regenerate <user-id> - Regenerate wallet for specific user')
      break
  }
}

if (require.main === module) {
  main().catch(console.error)
}

module.exports = {
  checkMigrationStatus,
  migrateUsers,
  regenerateUserWallet,
  listUsersWithoutWallets
}
