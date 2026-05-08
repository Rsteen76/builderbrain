import { useEffect, useState } from 'react';
import {
  CalendarEvent,
  CalendarTimelineService,
  TimelineData,
} from '../services/calendar-timeline';

export const useCalendarEvents = (userId: string | undefined, currentDate: Date) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));

  useEffect(() => {
    let isMounted = true;

    if (!userId) {
      setEvents([]);
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    setLoading(true);

    CalendarTimelineService.getCalendarEvents(userId, currentDate)
      .then(calendarEvents => {
        if (isMounted) setEvents(calendarEvents);
      })
      .catch(error => {
        console.error('Error fetching calendar data:', error);
        if (isMounted) setEvents([]);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userId, currentDate]);

  return { events, loading };
};

export const useTimelineData = (userId: string | undefined) => {
  const [data, setData] = useState<TimelineData>({ events: [], projects: [] });
  const [loading, setLoading] = useState(Boolean(userId));

  useEffect(() => {
    let isMounted = true;

    if (!userId) {
      setData({ events: [], projects: [] });
      setLoading(false);
      return () => {
        isMounted = false;
      };
    }

    setLoading(true);

    CalendarTimelineService.getTimelineData(userId)
      .then(timelineData => {
        if (isMounted) setData(timelineData);
      })
      .catch(error => {
        console.error('Error fetching timeline data:', error);
        if (isMounted) setData({ events: [], projects: [] });
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { ...data, loading };
};
