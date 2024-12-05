import React from "react";
import { useLocation } from "react-router-dom";

const TeacherDataPage = () => {
  const location = useLocation();
  const teacherName = location.state?.teacherName || "Unknown Teacher"; // Default to "Unknown Teacher" if no name is provided

  // Static data for demonstration purposes
  const timetable = [
    { time: "9:00 AM - 10:00 AM", subject: "Mathematics" },
    { time: "10:00 AM - 11:00 AM", subject: "Science" },
    { time: "11:30 AM - 12:30 PM", subject: "English" },
    { time: "1:00 PM - 2:00 PM", subject: "History" },
  ];

  const notices = [
    "Parent-Teacher Meeting on Friday at 4 PM",
    "Submit attendance reports by end of the week",
    "Holiday on Monday for Teacher's Day",
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-6">
      {/* Header */}
      <h1 className="text-4xl font-bold mb-6">Welcome, {teacherName}</h1>

      {/* Timetable Section */}
      <div className="w-full max-w-4xl bg-gray-800 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold mb-4">Timetable</h2>
        <table className="w-full text-left text-white">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="py-2">Time</th>
              <th className="py-2">Subject</th>
            </tr>
          </thead>
          <tbody>
            {timetable.map((entry, index) => (
              <tr key={index} className="border-b border-gray-700">
                <td className="py-2">{entry.time}</td>
                <td className="py-2">{entry.subject}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Notices Section */}
      <div className="w-full max-w-4xl bg-gray-800 rounded-lg p-6">
        <h2 className="text-2xl font-semibold mb-4">Notices</h2>
        <ul className="list-disc list-inside text-white">
          {notices.map((notice, index) => (
            <li key={index} className="py-1">
              {notice}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TeacherDataPage;