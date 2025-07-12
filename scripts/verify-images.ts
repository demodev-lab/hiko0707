import { existsSync, statSync } from 'fs'
import { join } from 'path'
import imageMappingData from '../lib/db/image-mapping.json'

function verifyLocalImages() {
  console.log('🔍 Verifying local image files...')
  
  const mapping = imageMappingData as Record<string, string>
  const totalImages = Object.keys(mapping).length
  let validImages = 0
  let missingImages = 0
  
  console.log(`📊 Total mapped images: ${totalImages}`)
  
  Object.entries(mapping).forEach(([index, imagePath]) => {
    // Convert URL path to filesystem path
    const fullPath = join(process.cwd(), 'public', imagePath)
    
    if (existsSync(fullPath)) {
      const stats = statSync(fullPath)
      const sizeKB = Math.round(stats.size / 1024)
      validImages++
      
      if (parseInt(index) < 5) {
        console.log(`✅ ${index}: ${imagePath} (${sizeKB}KB)`)
      }
    } else {
      missingImages++
      console.log(`❌ Missing: ${imagePath}`)
    }
  })
  
  console.log(`\n📈 Results:`)
  console.log(`  ✅ Valid images: ${validImages}`)
  console.log(`  ❌ Missing images: ${missingImages}`)
  console.log(`  📊 Success rate: ${Math.round((validImages / totalImages) * 100)}%`)
  
  if (validImages > 0) {
    console.log(`\n🎉 Image mapping verification completed successfully!`)
    console.log(`🌐 Images should now be visible on http://localhost:3001/hotdeals`)
  } else {
    console.log(`\n⚠️ No valid images found. Please check the file paths.`)
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  verifyLocalImages()
}

export { verifyLocalImages }