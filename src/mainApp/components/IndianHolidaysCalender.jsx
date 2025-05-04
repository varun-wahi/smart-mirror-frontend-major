import React, { useEffect, useState } from 'react';
import { Calendar } from 'lucide-react';
import ICAL from 'ical.js';

const ICAL_URL = "https://ics.calendarlabs.com/33/8f017165/India_Holidays.ics";

const IndianHolidaysCalendar = () => {
  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const response = await fetch(ICAL_URL);
        const text = await response.text();

        const jcalData = ICAL.parse(text);
        const comp = new ICAL.Component(jcalData);
        const vevents = comp.getAllSubcomponents('vevent');

        const now = new Date();

        const upcoming = vevents
          .map(event => {
            const summary = event.getFirstPropertyValue('summary');
            const dtstart = event.getFirstPropertyValue('dtstart').toJSDate();
            return { name: summary, date: dtstart };
          })
          .filter(event => event.date >= now)
          .sort((a, b) => a.date - b.date)
          .slice(0, 5)
          .map(event => ({
            name: event.name,
            date: event.date.toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short'
            })
          }));

        setHolidays(upcoming);
      } catch (error) {
        console.error("Failed to fetch or parse calendar:", error);
      }
    };

    fetchHolidays();
  }, []);

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center mb-2">
        <Calendar className="w-5 h-5 mr-2 opacity-80" />
        <h2 className="text-lg font-light tracking-wider">Upcoming Holidays</h2>
      </div>
      <div className="space-y-3">
        {holidays.map((holiday, index) => (
          <div key={index} className="flex items-center opacity-90 hover:opacity-100 transition-opacity">
            <div className="w-16 text-gray-400 font-light">{holiday.date}</div>
            <div className="text-white font-extralight">{holiday.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IndianHolidaysCalendar;