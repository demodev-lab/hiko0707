import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: Request) {
  try {
    const { hotdeals } = await request.json()
    
    if (!Array.isArray(hotdeals)) {
      return NextResponse.json({ error: 'Invalid data format' }, { status: 400 })
    }
    
    const exportsDir = path.join(process.cwd(), 'exports')
    await fs.mkdir(exportsDir, { recursive: true })
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `hotdeal-manual-export-${timestamp}.json`
    const filepath = path.join(exportsDir, filename)
    
    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        totalDeals: hotdeals.length,
        source: 'manual-export',
        version: '1.0.0',
        exportedBy: 'HotdealManager'
      },
      hotdeals: hotdeals
    }
    
    await fs.writeFile(filepath, JSON.stringify(exportData, null, 2), 'utf-8')
    
    return NextResponse.json({ 
      success: true, 
      filename,
      filepath: `/exports/${filename}`
    })
  } catch (error) {
    console.error('Failed to export data:', error)
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 })
  }
}