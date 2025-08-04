import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Create Supabase client with service role key for full access
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function listTables() {
  console.log('=== Supabase Tables Test ===')
  
  try {
    // Try different approaches to list tables
    let tables: any[] | null = null
    let error: any = null
    
    // Approach 1: Try common Supabase tables
    console.log('\n🔍 Checking for common Supabase tables...')
    
    // Check if we have any custom tables by trying to access them
    const testTables = ['profiles', 'users', 'posts', 'hotdeals', 'orders']
    
    for (const tableName of testTables) {
      try {
        const { count, error: tableError } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true })
        
        if (!tableError) {
          console.log(`✅ Table '${tableName}' exists (count: ${count || 0})`)
          if (!tables) tables = []
          tables.push({ table_name: tableName })
        } else if (tableError.code === '42P01') {
          console.log(`⚠️  Table '${tableName}' does not exist`)
        } else {
          console.log(`❌ Error accessing '${tableName}': ${tableError.message}`)
        }
      } catch (err) {
        console.log(`❌ Unexpected error checking '${tableName}':`, err)
      }
    }
    
    // Check auth system
    console.log('\n🔍 Checking auth system...')
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (!authError) {
        console.log('✅ Auth system is accessible')
        if (user) {
          console.log(`   Authenticated as: ${user.email}`)
        } else {
          console.log('   No authenticated user')
        }
      } else {
        console.log(`⚠️  Auth error: ${authError.message}`)
      }
    } catch (err) {
      console.log('❌ Error checking auth:', err)
    }
    
    // Check storage buckets
    console.log('\n🔍 Checking storage buckets...')
    try {
      const { data: buckets, error: storageError } = await supabase
        .storage
        .listBuckets()
      
      if (!storageError) {
        console.log(`✅ Storage system is accessible (${buckets?.length || 0} buckets)`)
        buckets?.forEach(bucket => {
          console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`)
        })
      } else {
        console.log(`⚠️  Storage error: ${storageError.message}`)
      }
    } catch (err) {
      console.log('❌ Error checking storage:', err)
    }
    
    // Summary
    console.log('\n📊 Summary:')
    if (tables && tables.length > 0) {
      console.log(`✅ Found ${tables.length} accessible tables`)
    } else {
      console.log('⚠️  No custom tables found (this might be a new project)')
    }
    console.log('\n💡 To create tables, use:')
    console.log('   1. Supabase Dashboard SQL Editor')
    console.log('   2. Migration files with Supabase CLI')
    console.log('   3. MCP server commands (if available)')
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

listTables()