'use client'

import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Search, Globe, Home } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card } from '@/components/ui/card'

interface AddressSearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (address: AddressData) => void
  initialSearchType?: 'korean' | 'english'
  searchType?: 'korean' | 'english'
}

interface AddressData {
  fullAddress: string
  postalCode: string
  city: string
  state: string
  country: string
  detailAddress?: string
}

declare global {
  interface Window {
    daum: any
  }
}

export function AddressSearchModal({ open, onOpenChange, onSelect, initialSearchType = 'korean', searchType: propSearchType }: AddressSearchModalProps) {
  const [searchType, setSearchType] = useState<'korean' | 'english'>(propSearchType || initialSearchType)
  const [searchQuery, setSearchQuery] = useState('')
  const [englishResults, setEnglishResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [useEnglishAddress, setUseEnglishAddress] = useState(false)

  // 모달이 닫힐 때 상태 초기화
  const handleClose = useCallback(() => {
    setSearchQuery('')
    setEnglishResults([])
    setLoading(false)
    const container = document.getElementById('daum-postcode-wrap')
    if (container) {
      container.style.display = 'none'
    }
    if (onOpenChange && typeof onOpenChange === 'function') {
      onOpenChange(false)
    }
  }, [onOpenChange])

  // 모달이 열릴 때 초기 검색 타입 설정
  useEffect(() => {
    if (open) {
      setSearchType(propSearchType || initialSearchType)
    }
  }, [open, initialSearchType, propSearchType])

  // Daum 주소 API 스크립트 로드
  useEffect(() => {
    if (searchType === 'korean' && open) {
      const script = document.createElement('script')
      script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
      script.async = true
      document.body.appendChild(script)

      return () => {
        document.body.removeChild(script)
      }
    }
  }, [searchType, open])

  // 한국 주소 검색 (Daum 주소 API)
  const handleKoreanSearch = useCallback(() => {
    if (!window.daum) return
    
    new window.daum.Postcode({
      oncomplete: function(data: any) {
        // 주소 정보 추출
        let fullAddress = data.address
        let extraAddress = ''

        if (data.addressType === 'R') {
          if (data.bname !== '') {
            extraAddress += data.bname
          }
          if (data.buildingName !== '') {
            extraAddress += extraAddress !== '' ? `, ${data.buildingName}` : data.buildingName
          }
          fullAddress += extraAddress !== '' ? ` (${extraAddress})` : ''
        }

        // 영문 주소 사용 여부에 따라 주소 설정
        let finalAddress = fullAddress
        
        // 영문 주소를 사용하는 경우
        if (useEnglishAddress) {
          // Daum API가 제공하는 영문 주소가 있으면 사용
          if (data.addressEnglish) {
            finalAddress = data.addressEnglish
          } else {
            // 영문 주소가 없으면 도로명 주소를 영문으로 변환 (시뮬레이션)
            // 실제로는 별도의 번역 API나 매핑 테이블이 필요
            const englishAddress = data.roadAddress || data.jibunAddress || fullAddress
            finalAddress = englishAddress
          }
        }
        
        const addressData: AddressData = {
          fullAddress: finalAddress,
          postalCode: data.zonecode,
          city: useEnglishAddress && data.sigunguEnglish ? data.sigunguEnglish : (data.sigungu || data.sido),
          state: useEnglishAddress && data.sidoEnglish ? data.sidoEnglish : data.sido,
          country: useEnglishAddress ? 'Republic of Korea' : '대한민국',
          detailAddress: ''
        }

        onSelect(addressData)
        handleClose()
      },
      width: '100%',
      height: '100%',
      maxSuggestItems: 5,
      theme: {
        bgColor: "#FFFFFF",
        searchBgColor: "#FFFFFF",
        contentBgColor: "#FFFFFF",
        pageBgColor: "#FAFAFA",
        textColor: "#333333",
        queryTextColor: "#222222",
        postcodeTextColor: "#FA4256",
        emphTextColor: "#008BD3",
        outlineColor: "#E0E0E0"
      }
    }).embed(document.getElementById('daum-postcode-wrap'))
  }, [handleClose, onSelect, useEnglishAddress])

  // 한국 주소 검색 자동 시작
  useEffect(() => {
    if (searchType === 'korean' && open && window.daum) {
      // 약간의 지연을 주어 모달이 완전히 렌더링된 후 실행
      setTimeout(() => {
        const container = document.getElementById('daum-postcode-wrap')
        if (container) {
          container.style.display = 'block'
          handleKoreanSearch()
        }
      }, 100)
    }
  }, [searchType, open, handleKoreanSearch])

  // 영문 주소 검색 (한국 주소를 영문으로 검색)
  const handleEnglishSearch = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    
    // 실제로는 한국 주소를 영문으로 검색하는 API를 사용해야 하지만, 
    // 여기서는 시뮬레이션된 데이터를 사용합니다
    setTimeout(() => {
      const mockResults = [
        {
          id: '1',
          description: '123 Teheran-ro, Gangnam-gu, Seoul 06234, Korea',
          structured: {
            fullAddress: '123 Teheran-ro, Gangnam-gu, Seoul 06234, Korea',
            postalCode: '06234',
            city: 'Gangnam-gu',
            state: 'Seoul',
            country: 'Korea'
          }
        },
        {
          id: '2',
          description: '456 Sejong-daero, Jung-gu, Seoul 04519, Korea',
          structured: {
            fullAddress: '456 Sejong-daero, Jung-gu, Seoul 04519, Korea',
            postalCode: '04519',
            city: 'Jung-gu',
            state: 'Seoul',
            country: 'Korea'
          }
        },
        {
          id: '3',
          description: '789 Gwangbok-ro, Jung-gu, Busan 48953, Korea',
          structured: {
            fullAddress: '789 Gwangbok-ro, Jung-gu, Busan 48953, Korea',
            postalCode: '48953',
            city: 'Jung-gu',
            state: 'Busan',
            country: 'Korea'
          }
        },
        {
          id: '4',
          description: '321 Dongseong-ro, Jung-gu, Daegu 41940, Korea',
          structured: {
            fullAddress: '321 Dongseong-ro, Jung-gu, Daegu 41940, Korea',
            postalCode: '41940',
            city: 'Jung-gu',
            state: 'Daegu',
            country: 'Korea'
          }
        },
        {
          id: '5',
          description: '654 Jungang-ro, Wansan-gu, Jeonju 54999, Korea',
          structured: {
            fullAddress: '654 Jungang-ro, Wansan-gu, Jeonju 54999, Korea',
            postalCode: '54999',
            city: 'Wansan-gu',
            state: 'Jeonju',
            country: 'Korea'
          }
        }
      ].filter(result => 
        result.description.toLowerCase().includes(searchQuery.toLowerCase())
      )

      setEnglishResults(mockResults)
      setLoading(false)
    }, 500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>
            {searchType === 'korean' ? '우편번호로 주소 찾기' : '한국 주소 영문 검색'}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 space-y-4">

          {/* 한국 주소 검색 */}
          {searchType === 'korean' && (
            <div className="space-y-4">
              <div className="flex items-center justify-end">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="useEnglishAddress"
                    checked={useEnglishAddress}
                    onChange={(e) => setUseEnglishAddress(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="useEnglishAddress" className="text-sm">
                    검색 결과를 영문으로 표시
                  </Label>
                </div>
              </div>
              
              <div 
                id="daum-postcode-wrap" 
                className="border rounded-lg overflow-hidden"
                style={{ height: '450px', display: 'none' }}
              />
            </div>
          )}

          {/* 영문 주소 검색 */}
          {searchType === 'english' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="한국 주소를 영문으로 검색 (예: Gangnam, Seoul)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleEnglishSearch()}
                  autoFocus
                />
                <Button 
                  onClick={handleEnglishSearch}
                  disabled={loading || !searchQuery.trim()}
                >
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              {/* 검색 결과 */}
              {englishResults.length > 0 && (
                <ScrollArea className="h-[300px] border rounded-lg p-4">
                  <div className="space-y-2">
                    {englishResults.map((result) => (
                      <Card
                        key={result.id}
                        className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => {
                          onSelect(result.structured)
                          handleClose()
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="font-medium">{result.description}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}

              {loading && (
                <div className="text-center py-8 text-gray-500">
                  검색 중...
                </div>
              )}

              {!loading && searchQuery && englishResults.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  검색 결과가 없습니다.
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}