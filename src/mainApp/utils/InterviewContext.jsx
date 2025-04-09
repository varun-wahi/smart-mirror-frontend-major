import React, { createContext, useContext, useState } from "react";

const InterviewContext = createContext();

export const InterviewProvider = ({ children }) => {
  const [interviewData, setInterviewData] = useState({
    topic: "React js",
    difficulty: "Medium",
    questionCount: 5,
  });

  return (
    <InterviewContext.Provider value={{ interviewData, setInterviewData }}>
      {children}
    </InterviewContext.Provider>
  );
};

export const useInterview = () => useContext(InterviewContext);