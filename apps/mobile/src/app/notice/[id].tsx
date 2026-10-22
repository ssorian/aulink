import { NoticeDetailScreen } from '@/modules/family/notice-detail-screen';
import { RequireChild } from '@/modules/family/session';

export default function Notice() {
  return <RequireChild><NoticeDetailScreen /></RequireChild>;
}
