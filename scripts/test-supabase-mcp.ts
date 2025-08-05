import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('=== Supabase MCP Connection Test ===')
console.log('URL:', supabaseUrl)
console.log('Project Ref:', supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1])
console.log('Anon Key (first 20 chars):', supabaseAnonKey?.substring(0, 20) + '...')
console.log('Service Role Key (first 20 chars):', supabaseServiceRoleKey?.substring(0, 20) + '...')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  try {
    console.log('\n🔄 Testing connection...')
    
    // Try to list tables using SQL query
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5)
    
    if (error) {
      // Try a simpler approach - just check if we can access the auth system
      const { data: authData, error: authError } = await supabase.auth.getSession()
      
      if (authError) {
        console.error('❌ Connection failed:', authError.message)
      } else {
        console.log('✅ Connection successful!')
        console.log('   Auth system is accessible')
        
        // Try to get project settings (this might fail without proper permissions)
        try {
          const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            headers: {
              'apikey': supabaseAnonKey!,
              'Authorization': `Bearer ${supabaseAnonKey!}`
            }
          })
          
          if (response.ok) {
            console.log('✅ REST API is accessible')
          } else {
            console.log('⚠️  REST API returned status:', response.status)
          }
        } catch (fetchError) {
          console.log('⚠️  Could not test REST API')
        }
      }
    } else {
      console.log('✅ Connection successful!')
      console.log('   Found tables:', data?.map(t => t.table_name).join(', '))
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

testConnection()