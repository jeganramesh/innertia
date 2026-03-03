import { Class, Session, FacultyStats, SessionReport, UploadFile } from '../types';

export const mockClasses: Class[] = [
    {
        id: '1',
        name: 'Introduction to Computer Science',
        subject: 'Computer Science',
        lastSession: new Date('2023-10-25T10:00:00'),
        studentCount: 45,
        status: 'active',
        createdAt: new Date('2023-09-01T00:00:00'),
        updatedAt: new Date('2023-10-25T12:00:00'),
    },
    {
        id: '2',
        name: 'Advanced Mathematics',
        subject: 'Mathematics',
        lastSession: new Date('2023-10-24T14:30:00'),
        studentCount: 32,
        status: 'active',
        createdAt: new Date('2023-09-01T00:00:00'),
        updatedAt: new Date('2023-10-24T16:00:00'),
    },
    {
        id: '3',
        name: 'Physics 101',
        subject: 'Physics',
        lastSession: new Date('2023-10-23T09:00:00'),
        studentCount: 50,
        status: 'active',
        createdAt: new Date('2023-09-02T00:00:00'),
        updatedAt: new Date('2023-10-23T11:00:00'),
    },
    {
        id: '4',
        name: 'Data Structures and Algorithms',
        subject: 'Computer Science',
        lastSession: new Date('2023-10-20T11:00:00'),
        studentCount: 40,
        status: 'active',
        createdAt: new Date('2023-09-05T00:00:00'),
        updatedAt: new Date('2023-10-20T13:00:00'),
    },
    {
        id: '5',
        name: 'History of Art',
        subject: 'Art',
        lastSession: new Date('2023-10-15T15:00:00'),
        studentCount: 25,
        status: 'archived',
        createdAt: new Date('2023-08-15T00:00:00'),
        updatedAt: new Date('2023-10-15T16:30:00'),
    },
];

export const mockSessions: Session[] = [
    {
        id: '101',
        classId: '1',
        className: 'Introduction to Computer Science',
        startTime: new Date('2023-10-25T10:00:00'),
        endTime: new Date('2023-10-25T11:30:00'),
        attendanceRate: 95,
        status: 'completed',
        topic: 'Binary Search Trees',
    },
    {
        id: '102',
        classId: '2',
        className: 'Advanced Mathematics',
        startTime: new Date('2023-10-24T14:30:00'),
        endTime: new Date('2023-10-24T16:00:00'),
        attendanceRate: 88,
        status: 'completed',
        topic: 'Calculus III: Multiple Integrals',
    },
    {
        id: '103',
        classId: '3',
        className: 'Physics 101',
        startTime: new Date('2023-10-23T09:00:00'),
        endTime: new Date('2023-10-23T10:30:00'),
        attendanceRate: 92,
        status: 'completed',
        topic: 'Newton\'s Laws of Motion',
    },
    {
        id: '104',
        classId: '1',
        className: 'Introduction to Computer Science',
        startTime: new Date('2023-10-22T10:00:00'),
        endTime: new Date('2023-10-22T11:30:00'),
        attendanceRate: 98,
        status: 'completed',
        topic: 'Hash Maps',
    },
    {
        id: '105',
        classId: '4',
        className: 'Data Structures and Algorithms',
        startTime: new Date('2023-10-20T11:00:00'),
        endTime: new Date('2023-10-20T12:30:00'),
        attendanceRate: 85,
        status: 'completed',
        topic: 'Graph Theory Intro',
    },
];

export const mockStats: FacultyStats = {
    totalClasses: 5,
    activeClasses: 4,
    totalSessions: 125,
    totalStudents: 192,
    averageAttendance: 91.6,
};

export const mockUploadFiles: UploadFile[] = [
    {
        id: 'f1',
        name: 'Lecture_Notes_Week1.pdf',
        type: 'pdf',
        size: 1024 * 1024 * 2.5, // 2.5MB
        url: '#',
        uploadedAt: new Date('2023-09-05T09:00:00'),
        classId: '1',
    },
    {
        id: 'f2',
        name: 'Assignment_1.docx',
        type: 'docx',
        size: 1024 * 500, // 500KB
        url: '#',
        uploadedAt: new Date('2023-09-10T14:00:00'),
        classId: '1',
    },
];

export const mockSessionReport: SessionReport = {
    sessionId: '101',
    className: 'Introduction to Computer Science',
    date: new Date('2023-10-25T10:00:00'),
    duration: 90,
    attendance: {
        present: 43,
        absent: 2,
        rate: 95.5,
    },
    engagement: {
        average: 85,
        peak: 92,
    },
    notes: 'Students were very engaged during the live coding session.',
};
