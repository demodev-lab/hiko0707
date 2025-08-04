require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableSchema() {
  console.log('🔍 hot_deals 테이블 스키마 확인...');
  
  try {
    // PostgreSQL 메타 정보 조회 쿼리
    const { data, error } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT 
            column_name, 
            data_type, 
            is_nullable, 
            column_default 
          FROM information_schema.columns 
          WHERE table_name = 'hot_deals' 
          ORDER BY ordinal_position;
        `
      });
      
    if (error) {
      console.error('❌ 스키마 조회 실패:', error);
      
      // 대안: 빈 데이터로 INSERT 시도해서 오류 메시지 분석
      console.log('🔄 대안: 빈 INSERT로 필수 필드 확인...');
      
      const { data: insertData, error: insertError } = await supabase
        .from('hot_deals')
        .insert({})
        .select()
        .single();
        
      if (insertError) {
        console.log('📋 필수 필드 오류 정보:');
        console.log('- 코드:', insertError.code);
        console.log('- 메시지:', insertError.message);
        console.log('- 상세:', insertError.details);
      }
      
      return;
    }
    
    console.log('📋 테이블 스키마:');
    console.log('필드명 | 타입 | NULL 허용 | 기본값');
    console.log(''.padEnd(60, '-'));
    
    data?.forEach(col => {
      const name = col.column_name.padEnd(20);
      const type = col.data_type.padEnd(15);
      const nullable = col.is_nullable === 'YES' ? 'O' : 'X';
      const defaultVal = col.column_default || '';
      console.log(`${name} | ${type} | ${nullable.padEnd(8)} | ${defaultVal}`);
    });
    
  } catch (err) {
    console.error('❌ 스키마 확인 중 오류:', err);
  }
}

checkTableSchema().catch(console.error);