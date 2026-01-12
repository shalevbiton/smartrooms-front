
import { Booking, Room, User } from '../types';

/**
 * Triggers a browser download of a string content as a file
 */
export const downloadFile = (content: string, fileName: string, contentType: string) => {
  // Add BOM for Microsoft Excel compatibility
  const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
  const blob = new Blob([bom, content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Formats a single booking into a human-readable text summary
 */
export const generateBookingSummary = (booking: Booking, roomName: string) => {
  const startTime = new Date(booking.startTime).toLocaleString('he-IL');
  const endTime = new Date(booking.endTime).toLocaleString('he-IL');

  return `
=========================================
      SmartRoom - אישור הזמנת חדר
=========================================
מזהה הזמנה: ${booking.id}
סטטוס: ${booking.status}
נוצר בתאריך: ${new Date(booking.createdAt).toLocaleString('he-IL')}

פרטי החדר:
----------
שם החדר: ${roomName}
מערכת תיעוד: ${booking.isRecorded ? 'פעילה (מוקלטת)' : 'לא פעילה'}

פרטי החקירה:
-----------
חוקר מבצע: ${booking.title}
מספר אישי חוקר: ${booking.investigatorId}
טלפון ליצירת קשר: ${booking.phoneNumber || 'לא הוזן'}

נחקר: ${booking.interrogatedName}
מ"א/ת"ז נחקר: ${booking.secondInvestigatorId}

סוג עבירה: ${booking.offenses}

זמני שימוש:
-----------
שעת התחלה: ${startTime}
שעת סיום: ${endTime}

-----------------------------------------
הופק ע"י מערכת SmartRoom - שימוש פנימי
=========================================
  `.trim();
};

/**
 * Converts an array of bookings to CSV format
 */
export const convertToCSV = (bookings: Booking[], rooms: Room[]) => {
  const header = [
    'מזהה', 'שם חוקר', 'מ"א חוקר', 'נחקר', 'סוג', 'עבירה', 'חדר', 'התחלה', 'סיום', 'סטטוס', 'מוקלט'
  ].join(',');

  const rows = bookings.map(b => {
    const room = rooms.find(r => r.id === b.roomId)?.name || 'לא ידוע';
    return [
      b.id,
      `"${b.title}"`,
      b.investigatorId,
      `"${b.interrogatedName}"`,
      b.type === 'TESTIMONY' ? 'עדות' : 'חקירה',
      `"${b.offenses}"`,
      `"${room}"`,
      new Date(b.startTime).toLocaleString('he-IL'),
      new Date(b.endTime).toLocaleString('he-IL'),
      b.status,
      b.isRecorded ? 'כן' : 'לא'
    ].join(',');
  });

  return [header, ...rows].join('\n');
};

/**
 * Converts an array of users to CSV format
 */
export const convertUsersToCSV = (users: User[]) => {
  const header = [
    'מזהה', 'מספר אישי', 'שם מלא', 'בסיס', 'תפקיד', 'טלפון', 'תפקיד מערכת', 'סטטוס'
  ].join(',');

  const rows = users.map(u => {
    return [
      u.id,
      u.personalId,
      `"${u.name}"`,
      `"${u.base}"`,
      `"${u.jobTitle || ''}"`,
      u.phoneNumber || '',
      u.role,
      u.status
    ].join(',');
  });

  return [header, ...rows].join('\n');
};
/**
 * Copies the bookings to clipboard in a specific format
 */
/**
 * Generates the formatted text for clipboard
 */
export const generateBookingsClipboardText = (bookings: Booking[], rooms: Room[], users?: User[]) => {
  return bookings.map(b => {
    const room = rooms.find(r => r.id === b.roomId);
    const user = users?.find(u => u.id === b.userId);

    const startTime = new Date(b.startTime);
    const endTime = new Date(b.endTime);

    const getStatusText = (status: string) => {
      switch (status) {
        case 'APPROVED': return 'מאושר';
        case 'REJECTED': return 'סורב';
        case 'CANCELLED': return 'בוטל';
        case 'COMPLETED': return 'הושלם';
        default: return 'ממתין';
      }
    };

    return `
סטטוס: ${getStatusText(b.status)}
שם החדר: ${room?.name || 'לא ידוע'}
תאריך: ${startTime.toLocaleDateString('he-IL')}
שעות: ${startTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
מוקלט: ${b.isRecorded ? 'כן' : 'לא'}
מקום: ${room?.locationType === 'PRISON' ? 'מתחם כלא' : 'ימל"ם'}
בסיס: ${user?.base || 'לא ידוע'}
שם החוקר: ${b.title}
מספר אישי חוקר: ${b.investigatorId}
שם הנחקר: ${b.interrogatedName}
ת"ז/מ"א נחקר: ${b.secondInvestigatorId}
`.trim();
  }).join('\n\n----------------------------------------\n\n');
};

/**
 * Copies the bookings to clipboard in a specific format
 */
export const copyBookingsToClipboard = async (bookings: Booking[], rooms: Room[], users?: User[]) => {
  const content = generateBookingsClipboardText(bookings, rooms, users);

  try {
    await navigator.clipboard.writeText(content);
    return true;
  } catch (err) {
    console.error('Failed to copy: ', err);
    return false;
  }
};
