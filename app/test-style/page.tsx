'use client'

export default function TestStylePage() {
  return (
    <div className="min-h-screen bg-blue-500 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">CSS 테스트 페이지</h1>
      <p className="text-xl mb-4">이 페이지에서 파란색 배경이 보이면 Tailwind CSS가 정상 작동합니다.</p>
      <div className="bg-red-500 p-4 rounded-lg">
        <p>빨간색 박스</p>
      </div>
      <style jsx>{`
        .test-inline {
          color: green;
          font-size: 24px;
          margin-top: 20px;
        }
      `}</style>
      <p className="test-inline">인라인 스타일 테스트 (초록색)</p>
    </div>
  )
}