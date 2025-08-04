'use server'

import { CrawlerManager } from '@/lib/crawlers/crawler-manager'
import { revalidatePath } from 'next/cache'

export interface ImportResult {
  success: boolean
  message: string
  importedCount?: number
  error?: string
}

export async function importHotdealsFromFile(filename: string): Promise<ImportResult> {
  try {
    const manager = new CrawlerManager()
    const filepath = `./exports/${filename}`
    
    // JSON 파일에서 데이터 읽기
    const hotdeals = await manager.importFromJson(filepath)
    
    if (!hotdeals || hotdeals.length === 0) {
      return {
        success: false,
        message: '가져올 데이터가 없습니다.',
        error: 'No data found in file'
      }
    }
    
    // 메타데이터 생성
    const result = {
      success: true,
      message: `${hotdeals.length}개의 핫딜을 성공적으로 가져왔습니다. 브라우저에서 데이터를 저장하려면 /import-hotdeals.html 페이지를 사용하세요.`,
      importedCount: hotdeals.length
    }
    
    // 페이지 리로드 트리거
    revalidatePath('/hotdeals')
    revalidatePath('/admin/import-data')
    
    return result
  } catch (error) {
    console.error('Import failed:', error)
    return {
      success: false,
      message: '가져오기 실패',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    }
  }
}

export async function getAvailableExports(): Promise<string[]> {
  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    
    const exportsDir = './exports'
    const files = await fs.readdir(exportsDir)
    
    // JSON 파일만 필터링하고 날짜 역순으로 정렬
    const jsonFiles = files
      .filter(file => file.endsWith('.json') && file.startsWith('hotdeal-'))
      .sort((a, b) => b.localeCompare(a))
    
    return jsonFiles
  } catch (error) {
    console.error('Failed to list exports:', error)
    return []
  }
}