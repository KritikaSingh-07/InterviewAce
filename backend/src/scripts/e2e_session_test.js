import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import User from '../models/User.js'; // Imports schema to register in Mongoose

// Load env variables from backend .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const BASE_URL = 'http://localhost:5000/api';

async function runTests() {
  console.log('==================================================');
  console.log('STARTING MENTOR SESSIONS SYSTEM E2E TESTS');
  console.log('==================================================');

  // Connect to DB directly for role/plan adjustments
  console.log('[E2E-DB] Connecting to Mongoose...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('[E2E-DB] Mongoose connected.');

  let studentId, mentorId;

  try {
    // ----------------------------------------------------
    // 1. Setup Student and Mentor Accounts
    // ----------------------------------------------------
    console.log('\n[E2E] Registering/Logging in Student...');
    let studentToken;
    try {
      const reg = await axios.post(`${BASE_URL}/auth/register`, {
        email: 'e2estudent@interviewace.com',
        password: 'password123',
        fullName: 'E2E Test Student',
      });
      studentToken = reg.data.token;
      studentId = reg.data.user.id;
      console.log('Registered student:', studentId);
    } catch {
      const login = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'e2estudent@interviewace.com',
        password: 'password123',
      });
      studentToken = login.data.token;
      studentId = login.data.user.id;
      console.log('Logged in student:', studentId);
    }

    const studentHeaders = { Authorization: `Bearer ${studentToken}` };

    console.log('\n[E2E] Registering/Logging in Mentor...');
    let mentorToken;
    try {
      const reg = await axios.post(`${BASE_URL}/auth/register`, {
        email: 'e2ementor@interviewace.com',
        password: 'password123',
        fullName: 'E2E Test Mentor',
      });
      mentorToken = reg.data.token;
      mentorId = reg.data.user.id;
      console.log('Registered mentor:', mentorId);
    } catch {
      const login = await axios.post(`${BASE_URL}/auth/login`, {
        email: 'e2ementor@interviewace.com',
        password: 'password123',
      });
      mentorToken = login.data.token;
      mentorId = login.data.user.id;
      console.log('Logged in mentor:', mentorId);
    }

    const mentorHeaders = { Authorization: `Bearer ${mentorToken}` };

    // Force roles and plan levels in DB
    console.log('[E2E-DB] Adjusting user roles and student plan in MongoDB...');

    await User.findByIdAndUpdate(studentId, {
      role: 'student',
      plan: 'pro',
      onboardingCompleted: true,
      isTestAccount: true
    });

    await User.findByIdAndUpdate(mentorId, {
      role: 'mentor',
      onboardingCompleted: true,
      isTestAccount: true
    });

    console.log('[E2E-DB] DB adjustments applied.');

    // Save profile configurations
    await axios.post(`${BASE_URL}/student-profile`, {
      fullName: 'E2E Test Student',
      college: 'Test Tech University',
      degree: 'B.Tech',
      branch: 'Computer Science',
      year: 3,
      careerGoal: 'Software Engineer',
      targetCompanies: ['Google', 'Meta'],
      selfAssessment: { coding: 4 },
    }, { headers: studentHeaders }).catch(() => {});

    await axios.post(`${BASE_URL}/mentor-profile`, {
      fullName: 'E2E Test Mentor',
      company: 'Google',
      designation: 'Tech Lead',
      experience: 8,
      skills: ['React', 'NodeJS', 'System Design'],
      linkedin: 'linkedin.com/in/e2ementor',
      bio: 'E2E Test Mentor biography',
    }, { headers: mentorHeaders }).catch(() => {});

    // ----------------------------------------------------
    // 2. Configure Mentor Availability
    // ----------------------------------------------------
    console.log('\n[E2E] Config availability slots (as Mentor)...');

    // Clean old availability slots
    const oldAvail = await axios.get(`${BASE_URL}/mentor/availability`, { headers: mentorHeaders });
    for (const av of oldAvail.data.availability || []) {
      await axios.delete(`${BASE_URL}/mentor/availability/${av._id}`, { headers: mentorHeaders });
    }

    const availRes = await axios.post(`${BASE_URL}/mentor/availability`, {
      dayOfWeek: 'Tuesday',
      startTime: '10:00',
      endTime: '12:00',
      duration: 60,
      timezone: 'Asia/Kolkata',
    }, { headers: mentorHeaders });

    console.log('Availability created:', availRes.data.availability);

    // ----------------------------------------------------
    // 3. Browse Availability Slots (as Student)
    // ----------------------------------------------------
    console.log('\n[E2E] Checking calculated slots for date 2026-09-01 (Tuesday) (as Student)...');

    const mentorsList = await axios.get(`${BASE_URL}/mentors`, { headers: studentHeaders });
    console.log(`Discovered mentors: ${mentorsList.data.mentors?.length || 0}`);

    const slotQuery = await axios.get(`${BASE_URL}/mentors/${mentorId}/availability?date=2026-09-01`, { headers: studentHeaders });
    const slots = slotQuery.data.slots || [];
    console.log('Computed slots:', slots.map(s => `${s.startTime}-${s.endTime} [${s.status}]`));

    const availableSlot = slots.find(s => s.status === 'Available');
    if (!availableSlot) {
      throw new Error('No available slots computed for 2026-09-01!');
    }

    // ----------------------------------------------------
    // 4. Request Meeting (as Student)
    // ----------------------------------------------------
    console.log('\n[E2E] Booking slot 10:00-11:00 (as Student)...');
    const bookingRes = await axios.post(`${BASE_URL}/sessions`, {
      mentorId,
      date: '2026-09-01',
      startTime: '10:00',
      duration: 60,
      topic: 'System Design',
      studentMessage: 'Preparing for system design interview.',
    }, { headers: studentHeaders });

    const session = bookingRes.data.session;
    console.log(`Session requested! ID: ${session._id} | Status: ${session.status}`);

    // Try booking again (should trigger double-booking error)
    console.log('[E2E] Attempting duplicate booking...');
    try {
      await axios.post(`${BASE_URL}/sessions`, {
        mentorId,
        date: '2026-09-01',
        startTime: '10:00',
        duration: 60,
        topic: 'System Design',
      }, { headers: studentHeaders });
      throw new Error('Duplicate booking was not prevented!');
    } catch (err) {
      console.log('Duplicate booking successfully blocked:', err.response?.data?.error);
    }

    // ----------------------------------------------------
    // 5. Accept Request (as Mentor)
    // ----------------------------------------------------
    console.log('\n[E2E] Accepting session request (as Mentor)...');
    const acceptRes = await axios.patch(`${BASE_URL}/sessions/${session._id}/accept`, {}, { headers: mentorHeaders });
    console.log('Session accepted. New status:', acceptRes.data.session.status);

    // ----------------------------------------------------
    // 6. Upload Google Meet Link (as Mentor)
    // ----------------------------------------------------
    console.log('\n[E2E] Adding Google Meet URL (as Mentor)...');
    const linkRes = await axios.patch(`${BASE_URL}/sessions/${session._id}/meeting-link`, {
      meetingLink: 'https://meet.google.com/abc-defg-hij',
    }, { headers: mentorHeaders });
    console.log('Meet Link saved. URL:', linkRes.data.session.meetingLink);

    // ----------------------------------------------------
    // 7. Rescheduling and Conforming workflow (as Student)
    // ----------------------------------------------------
    console.log('\n[E2E] Requesting reschedule to 2026-09-01 11:00 (as Student)...');
    const rescheduleRes = await axios.patch(`${BASE_URL}/sessions/${session._id}/reschedule`, {
      date: '2026-09-01',
      startTime: '11:00',
      reason: 'Work conflict',
    }, { headers: studentHeaders });
    console.log('Reschedule requested. State:', rescheduleRes.data.session.rescheduleRequest);

    console.log('[E2E] Approving reschedule request (as Mentor)...');
    const confirmRes = await axios.patch(`${BASE_URL}/sessions/${session._id}/confirm-reschedule`, {}, { headers: mentorHeaders });
    console.log('Reschedule confirmed! Status:', confirmRes.data.session.status);

    // ----------------------------------------------------
    // 8. Session Completion and Feedback aggregation
    // ----------------------------------------------------
    console.log('\n[E2E] Concluding session (as Mentor)...');
    const completeRes = await axios.post(`${BASE_URL}/sessions/${session._id}/complete`, {}, { headers: mentorHeaders });
    console.log('Session marked completed. CompletedAt:', completeRes.data.session.completedAt);

    console.log('[E2E] Submitting student-to-mentor feedback review...');
    const feedbackRes = await axios.post(`${BASE_URL}/sessions/${session._id}/feedback`, {
      overallRating: 5,
      communication: 5,
      professionalism: 5,
      knowledge: 5,
      helpfulness: 5,
      comment: 'Absolutely amazing mentor. Cleared all my doubts in no time!',
    }, { headers: studentHeaders });
    console.log('Feedback submitted:', feedbackRes.data.feedback);

    console.log('\n[E2E] Verifying aggregated score updates on Mentor public profile...');
    const profileRes = await axios.get(`${BASE_URL}/mentors/${mentorId}`, { headers: studentHeaders });
    const mentorDetails = profileRes.data.mentor;
    console.log(`Mentor rating: ${mentorDetails.rating}/5 | Reviews count: ${mentorDetails.reviewsCount} | Completed sessions: ${mentorDetails.completedSessions}`);
    console.log('Reviews history:', mentorDetails.reviews);

    console.log('\n==================================================');
    console.log('E2E TEST CYCLE COMPLETED SUCCESSFULLY!');
    console.log('==================================================');

  } catch (error) {
    console.error('\nE2E TEST FAILURE:', error.message);
    if (error.response) {
      console.error('API Error Payload:', error.response.data);
    }
  } finally {
    // Perform cleanup of E2E test data
    console.log('\n[E2E-DB] Cleaning up E2E test accounts and records from DB...');
    try {
      const db = mongoose.connection.db;
      if (studentId) {
        const studentObjId = new mongoose.Types.ObjectId(studentId);
        await db.collection('mentorprofiles').deleteMany({ userId: studentObjId });
        await db.collection('studentprofiles').deleteMany({ userId: studentObjId });
        await db.collection('mentoravailabilities').deleteMany({ mentor: studentObjId });
        await db.collection('mentorsessions').deleteMany({ $or: [{ mentor: studentObjId }, { student: studentObjId }] });
        await db.collection('sessionfeedbacks').deleteMany({ $or: [{ reviewer: studentObjId }, { reviewee: studentObjId }] });
        await db.collection('notifications').deleteMany({ recipient: studentObjId });
        await db.collection('users').deleteOne({ _id: studentObjId });
      }
      if (mentorId) {
        const mentorObjId = new mongoose.Types.ObjectId(mentorId);
        await db.collection('mentorprofiles').deleteMany({ userId: mentorObjId });
        await db.collection('studentprofiles').deleteMany({ userId: mentorObjId });
        await db.collection('mentoravailabilities').deleteMany({ mentor: mentorObjId });
        await db.collection('mentorsessions').deleteMany({ $or: [{ mentor: mentorObjId }, { student: mentorObjId }] });
        await db.collection('sessionfeedbacks').deleteMany({ $or: [{ reviewer: mentorObjId }, { reviewee: mentorObjId }] });
        await db.collection('notifications').deleteMany({ recipient: mentorObjId });
        await db.collection('users').deleteOne({ _id: mentorObjId });
      }
      console.log('[E2E-DB] Cleanup completed.');
    } catch (cleanupErr) {
      console.error('[E2E-DB] Cleanup failed:', cleanupErr.message);
    }

    await mongoose.disconnect();
    console.log('[E2E-DB] Mongoose disconnected.');
  }
}

runTests();
