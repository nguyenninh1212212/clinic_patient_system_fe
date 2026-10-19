import type { AppointmentStatus, DoctorShiftDTO } from '@/types';

export interface ScheduleEntry {
  doctorId: string;
  appointmentDate: string;
  status: AppointmentStatus;
}
export interface BookingSlot {
  time: string;
  endTime: string;
  status: 'available' | 'booked' | 'past';
}

export function clinicDate(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

export function bookingInstant(date: string, time: string): Date {
  return new Date(`${date}T${time}:00+07:00`);
}

const minutes = (time: string) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));
const timeLabel = (value: number) => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;

export function buildBookingSlots(doctorId: string, date: string, shifts: DoctorShiftDTO[], entries: ScheduleEntry[], now = Date.now()): BookingSlot[] {
  const starts = new Set<number>();
  for (const shift of shifts) {
    if (shift.doctorId !== doctorId || shift.workDate.slice(0, 10) !== date) continue;
    for (let start = Math.ceil(minutes(shift.startTime) / 30) * 30; start + 30 <= minutes(shift.endTime); start += 30) {
      starts.add(start);
    }
  }
  return [...starts].sort((a, b) => a - b).map(start => {
    const time = timeLabel(start);
    const instant = bookingInstant(date, time).getTime();
    const booked = entries.some(entry => {
      if (entry.doctorId !== doctorId || ['CANCELLED', 'NO_SHOW'].includes(entry.status)) return false;
      const bookedStart = new Date(entry.appointmentDate).getTime();
      return bookedStart < instant + 30 * 60000 && bookedStart + 30 * 60000 > instant;
    });
    return { time, endTime: timeLabel(start + 30), status: booked ? 'booked' : instant <= now ? 'past' : 'available' };
  });
}
