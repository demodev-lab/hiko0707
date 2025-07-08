import { NotFound } from '@/components/ui/error'

export default function NotFoundPage() {
  return (
    <NotFound
      title="페이지를 찾을 수 없습니다"
      message="요청하신 페이지가 존재하지 않거나 삭제되었습니다. URL을 다시 확인해 주세요."
    />
  )
}