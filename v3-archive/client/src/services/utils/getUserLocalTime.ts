import { formatInTimeZone } from 'date-fns-tz';

export const getUserLocalTime = (timezone: string) => {
    try {
        return formatInTimeZone(new Date(), timezone, 'HH:mm');
    } catch (error) {
        return null;
    }
};
