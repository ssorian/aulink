import { RequireChild } from '@/modules/family/session';
import { AttendanceScreen } from '@/modules/family/attendance-screen';

export default function Attendance() {
  return <RequireChild><AttendanceScreen /></RequireChild>;
}
