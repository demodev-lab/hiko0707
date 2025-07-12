import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET() {
  try {
    const exportsDir = path.join(process.cwd(), 'exports')
    
    // exports 디렉토리가 없으면 생성
    try {
      await fs.access(exportsDir)
    } catch {
      await fs.mkdir(exportsDir, { recursive: true })
      return NextResponse.json([])
    }
    
    // JSON 파일 목록 가져오기
    const files = await fs.readdir(exportsDir)
    const jsonFiles = files
      .filter(file => file.endsWith('.json') && file.startsWith('hotdeal-'))
      .sort((a, b) => b.localeCompare(a)) // 최신 파일이 먼저 오도록
    
    return NextResponse.json(jsonFiles)
  } catch (error) {
    console.error('Failed to list exports:', error)
    return NextResponse.json({ error: 'Failed to list exports' }, { status: 500 })
  }
}