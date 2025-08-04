import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params
    
    // 보안을 위해 파일명 검증
    if (!filename.endsWith('.json') || filename.includes('..')) {
      return NextResponse.json({ error: 'Invalid filename' }, { status: 400 })
    }
    
    const filepath = path.join(process.cwd(), 'exports', filename)
    
    try {
      const content = await fs.readFile(filepath, 'utf-8')
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      })
    } catch (error) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
  } catch (error) {
    console.error('Failed to read file:', error)
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 })
  }
}