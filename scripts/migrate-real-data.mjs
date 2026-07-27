/**
 * Replace dummy students/courses with Navbharat Gurukulam–aligned real data.
 * Run: node scripts/migrate-real-data.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, "../data/admin-db.json");

const COURSE_MAP = {
  "56677d93-e56b-4a5f-9b87-6df22bf01038": {
    title: "UPSC Civil Services Foundation",
    shortDescription: "GS, CSAT, essay writing & current affairs for UPSC aspirants",
    description:
      "A structured foundation program covering Indian polity, history, geography, economy, CSAT, essay writing, and daily current affairs for UPSC and state civil services.",
    level: "intermediate",
    mode: "hybrid",
    duration: "16 weeks",
    language: "Hindi & English",
    requirements: ["Graduation or final-year student", "Basic reading habit"],
    outcomes: [
      "Build a strong GS & CSAT base",
      "Write structured answers and essays",
      "Follow a daily current-affairs routine",
    ],
    thumbnailUrl: "/images/course-business.jpg",
    oldTitles: ["Complete Web Development Bootcamp"],
  },
  "cbe524b5-5684-44a1-83ba-7a0df328f444": {
    title: "Research Methodology & Academic Writing",
    shortDescription: "Design studies, analyse data, and publish quality research",
    description:
      "Learn research design, literature review, qualitative and quantitative methods, citation standards, and academic writing for journals and dissertations.",
    level: "intermediate",
    mode: "recorded",
    duration: "10 weeks",
    language: "English",
    requirements: ["Basic familiarity with academic reading"],
    outcomes: [
      "Draft a research proposal",
      "Apply basic statistical analysis",
      "Prepare manuscripts for publication",
    ],
    thumbnailUrl: "/images/course-datascience.jpg",
    oldTitles: ["Python for Data Science"],
  },
  "7892c564-667f-4690-aca6-6bb648f43a69": {
    title: "Hindi Sahitya aur Bhasha",
    shortDescription: "Classical and modern Hindi literature with language mastery",
    description:
      "Explore Hindi sahitya, vyakaran, lekhan kala, and comprehension for competitive exams, teaching, and cultural literacy.",
    level: "beginner",
    mode: "live",
    duration: "8 weeks",
    language: "Hindi",
    requirements: [],
    outcomes: [
      "Read and interpret key Hindi texts",
      "Improve written and spoken Hindi",
      "Prepare for teaching and exam modules",
    ],
    thumbnailUrl: "/images/course-design.jpg",
    oldTitles: ["UI/UX Design Mastery"],
  },
  "b42b8af3-e1ef-4c03-8465-0d881c4bdf7f": {
    title: "NEP 2020 Teacher Training Program",
    shortDescription: "Pedagogy, assessment, and classroom practice under NEP 2020",
    description:
      "Practical teacher training on NEP 2020 frameworks, inclusive pedagogy, ICT in classrooms, and competency-based assessment.",
    level: "beginner",
    mode: "recorded",
    duration: "6 weeks",
    language: "Hindi & English",
    requirements: ["Teaching interest or B.Ed./D.El.Ed. background helpful"],
    outcomes: [
      "Apply NEP-aligned lesson planning",
      "Use formative assessment tools",
      "Integrate digital resources in teaching",
    ],
    thumbnailUrl: "/images/course-marketing.jpg",
    oldTitles: ["Digital Marketing Masterclass"],
  },
};

const STUDENT_ARJUN = {
  id: "demo-student",
  name: "Arjun Mehta",
  email: "arjun.mehta@email.com",
  phone: "+91 98102 34567",
  city: "New Delhi",
};

const STUDENT_KAVITA = {
  id: "fcefe7dd-f26f-423d-a24c-b4e293e2839b",
  name: "Kavita Singh",
  email: "kavita.singh@email.com",
  phone: "+91 98290 11223",
  city: "Jaipur",
};

const INSTRUCTOR_MAP = {
  "John Smith": { name: "Dr. Rajesh Kumar", email: "rajesh.kumar@navbharatgurukulam.com", expertise: "Civil Services", title: "UPSC Mentor", slug: "dr-rajesh-kumar", city: "New Delhi", country: "India" },
  "Sarah Johnson": { name: "Prof. Meera Iyer", email: "meera.iyer@navbharatgurukulam.com", expertise: "Research Methods", title: "Research Director", slug: "prof-meera-iyer", city: "Pune", country: "India" },
  "Emma Wilson": { name: "Dr. Sana Rahman", email: "emma@navbharatgurukulam.com", expertise: "Education & Hindi", title: "Senior Faculty", slug: "dr-sana-rahman", city: "Lucknow", country: "India" },
  "Michael Chen": { name: "Dr. Sana Rahman", email: "emma@navbharatgurukulam.com", expertise: "Education & Hindi", title: "Senior Faculty", slug: "dr-sana-rahman", city: "Lucknow", country: "India" },
};

const OLD_STUDENT_IDS = new Set([
  "6bdf82a5-ae82-4a83-b134-315ab0eb489c",
  "abce5768-ef3d-4898-9827-499f33a1f3db",
  "b719307d-216a-463c-8fab-07bd4040032e",
]);

const TITLE_ALIASES = Object.values(COURSE_MAP).flatMap((c) => [c.title, ...c.oldTitles]);

function titleForCourseId(courseId, fallback) {
  return COURSE_MAP[courseId]?.title ?? fallback;
}

function replaceCourseTitles(text) {
  if (!text || typeof text !== "string") return text;
  let out = text;
  for (const course of Object.values(COURSE_MAP)) {
    for (const old of course.oldTitles) {
      out = out.split(old).join(course.title);
    }
  }
  out = out.replace(/John Doe/g, STUDENT_ARJUN.name);
  out = out.replace(/Sarah Smith/g, STUDENT_KAVITA.name);
  out = out.replace(/john\.doe@email\.com/g, STUDENT_ARJUN.email);
  out = out.replace(/sarah\.smith@email\.com/g, STUDENT_KAVITA.email);
  out = out.replace(/John Smith/g, "Dr. Rajesh Kumar");
  out = out.replace(/Sarah Johnson/g, "Prof. Meera Iyer");
  out = out.replace(/Emma Wilson/g, "Dr. Sana Rahman");
  out = out.replace(/React JS Live Workshop/g, "UPSC Answer Writing Live Session");
  out = out.replace(/Data Science Workshop/g, "Research Methods Workshop");
  out = out.replace(/UI\/UX Design Critique Session/g, "Hindi Sahitya Discussion");
  out = out.replace(/Web Development Final Examination/g, "UPSC Foundation Final Examination");
  out = out.replace(/HTML & CSS Quick Check/g, "Polity & Constitution Quick Check");
  out = out.replace(/Build a Portfolio Website/g, "Essay Writing Assignment");
  out = out.replace(/Data Analysis Project/g, "Research Proposal Draft");
  return out;
}

function patchStudentRecord(record, student) {
  if (!record) return;
  if (record.studentId === "demo-student" || record.userId === "demo-student") {
    record.studentName = student.name;
    record.studentEmail = student.email;
  }
  if (record.userId === STUDENT_KAVITA.id || record.studentId === STUDENT_KAVITA.id) {
    record.studentName = STUDENT_KAVITA.name;
    record.studentEmail = STUDENT_KAVITA.email;
  }
  if (record.courseId && COURSE_MAP[record.courseId]) {
    record.courseTitle = COURSE_MAP[record.courseId].title;
  }
  if (record.courseTitle) record.courseTitle = replaceCourseTitles(record.courseTitle);
  if (record.message) record.message = replaceCourseTitles(record.message);
  if (record.title) record.title = replaceCourseTitles(record.title);
  if (record.name === "John Doe") {
    record.name = STUDENT_ARJUN.name;
    record.email = STUDENT_ARJUN.email;
  }
  if (record.name === "Sarah Smith") {
    record.name = STUDENT_KAVITA.name;
    record.email = STUDENT_KAVITA.email;
  }
}

const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));

// Categories
const catNames = {
  Technology: "Academic Programs",
  "Web Development": "Civil Services",
  "Frontend Development": "UPSC Foundation",
  "Backend Development": "State PCS",
  "Data Science": "Research & Writing",
  "Machine Learning": "Research Methods",
  Design: "Languages",
  "UI/UX Design": "Hindi & Urdu",
  "Digital Marketing": "Teacher Education",
};
for (const cat of db.categories ?? []) {
  if (catNames[cat.name]) {
    cat.name = catNames[cat.name];
    cat.slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    if (cat.description?.includes("technology")) {
      cat.description = "Academic and competitive exam programs";
    }
  }
}

// Instructors
for (const inst of db.instructors ?? []) {
  const patch = INSTRUCTOR_MAP[inst.name];
  if (patch) Object.assign(inst, patch);
}

// Users — remove filler students, rename demo accounts
db.users = (db.users ?? []).filter((u) => !OLD_STUDENT_IDS.has(u.id));
for (const u of db.users) {
  if (u.id === STUDENT_ARJUN.id) {
    u.name = STUDENT_ARJUN.name;
    u.email = STUDENT_ARJUN.email;
    u.phone = STUDENT_ARJUN.phone;
    u.city = STUDENT_ARJUN.city;
  }
  if (u.id === STUDENT_KAVITA.id) {
    u.name = STUDENT_KAVITA.name;
    u.email = STUDENT_KAVITA.email;
    u.phone = STUDENT_KAVITA.phone;
    u.city = STUDENT_KAVITA.city;
  }
  if (u.email === "emma@navbharatgurukulam.com") {
    u.name = "Dr. Sana Rahman";
    u.city = "Lucknow";
    u.country = "India";
  }
}

// Courses
for (const course of db.courses ?? []) {
  const patch = COURSE_MAP[course.id];
  if (patch) {
    Object.assign(course, {
      title: patch.title,
      shortDescription: patch.shortDescription,
      description: patch.description,
      level: patch.level,
      mode: patch.mode,
      duration: patch.duration,
      language: patch.language,
      requirements: patch.requirements,
      outcomes: patch.outcomes,
      thumbnailUrl: patch.thumbnailUrl,
    });
  }
}

// Enrollments — drop removed students, fix titles
db.enrollments = (db.enrollments ?? []).filter((e) => !OLD_STUDENT_IDS.has(e.userId));
for (const e of db.enrollments) {
  e.courseTitle = titleForCourseId(e.courseId, replaceCourseTitles(e.courseTitle));
}

// Recalculate enrollment counts
const enrollmentCounts = {};
for (const e of db.enrollments) {
  enrollmentCounts[e.courseId] = (enrollmentCounts[e.courseId] ?? 0) + 1;
}
for (const course of db.courses ?? []) {
  course.enrollments = enrollmentCounts[course.id] ?? 0;
  course.rating = course.enrollments > 0 ? course.rating : 0;
}

// Lessons, assignments, quizzes — title patches
for (const lesson of db.lessons ?? []) {
  if (lesson.title === "Introduction to HTML") lesson.title = "Indian Polity Overview";
  if (lesson.title === "CSS Fundamentals") lesson.title = "Constitution & Governance";
  if (lesson.title === "Python Basics") lesson.title = "Research Design Basics";
  if (lesson.title?.includes("HTML & CSS")) lesson.title = "Polity & Constitution Quick Check";
}
for (const a of db.assignments ?? []) {
  a.title = replaceCourseTitles(a.title);
  a.description = replaceCourseTitles(a.description);
  a.instructions = replaceCourseTitles(a.instructions);
}
for (const q of db.quizzes ?? []) {
  q.title = replaceCourseTitles(q.title);
  q.courseTitle = titleForCourseId(q.courseId, replaceCourseTitles(q.courseTitle));
}

// Orders / payments — remove Amit pending order, patch names
db.orders = (db.orders ?? [])
  .filter((o) => !OLD_STUDENT_IDS.has(o.userId))
  .map((o) => {
    patchStudentRecord(o, STUDENT_ARJUN);
    return o;
  });
db.payments = (db.payments ?? [])
  .filter((p) => !OLD_STUDENT_IDS.has(p.userId))
  .map((p) => {
    patchStudentRecord(p, STUDENT_ARJUN);
    return p;
  });

db.subscriptions = (db.subscriptions ?? [])
  .filter((s) => !OLD_STUDENT_IDS.has(s.userId))
  .map((s) => {
    patchStudentRecord(s, STUDENT_ARJUN);
    return s;
  });

for (const item of db.quizAttempts ?? []) patchStudentRecord(item, STUDENT_ARJUN);
for (const item of db.certificates ?? []) patchStudentRecord(item, STUDENT_ARJUN);
for (const item of db.assignmentSubmissions ?? []) {
  if (item.userId === "demo-student") item.content = "Submitted essay on federalism and cooperative governance.";
  if (item.userId === STUDENT_KAVITA.id) item.content = "Submitted research proposal on rural education outcomes.";
  patchStudentRecord(item, STUDENT_ARJUN);
}

for (const lc of db.liveClasses ?? []) {
  lc.title = replaceCourseTitles(lc.title);
  lc.description = replaceCourseTitles(lc.description);
  lc.instructorName = replaceCourseTitles(lc.instructorName);
  lc.enrolled = Math.min(lc.enrolled ?? 0, 24);
}

for (const blog of db.blogs ?? []) {
  if (blog.slug === "complete-guide-modern-react") {
    blog.title = "How to Start UPSC Preparation in 2026";
    blog.slug = "start-upsc-preparation-2026";
    blog.category = "Civil Services";
    blog.author = "Dr. Rajesh Kumar";
    blog.excerpt = "A practical roadmap for first-time UPSC aspirants.";
    blog.content =
      "Begin with NCERT basics, daily current affairs, answer writing practice, and a balanced GS–CSAT schedule.";
  }
  if (blog.slug === "career-in-data-science") {
    blog.title = "Writing Your First Research Paper";
    blog.slug = "writing-first-research-paper";
    blog.category = "Research";
    blog.author = "Prof. Meera Iyer";
    blog.excerpt = "From question to publication — steps every researcher should follow.";
    blog.content =
      "Choose a focused question, review literature thoroughly, collect evidence ethically, and revise before submission.";
  }
  blog.author = replaceCourseTitles(blog.author);
}

for (const t of db.testimonials ?? []) {
  if (t.name === "Rohan Patel") {
    t.name = "Vikram Joshi";
    t.role = "UPSC Aspirant";
    t.quote =
      "The foundation course gave me structure for GS and answer writing. Mentors reviewed my essays every week.";
  }
  if (t.name === "Priya Sharma") {
    t.name = "Ananya Reddy";
    t.role = "Research Scholar";
    t.quote =
      "Research Methodology helped me finalize my dissertation proposal and understand publication standards.";
  }
  if (t.name === "Amit Verma") {
    t.name = "Imran Khan";
    t.role = "School Teacher";
    t.quote =
      "The NEP teacher training modules were practical and immediately useful in my classroom.";
  }
}

for (const role of db.roles ?? []) {
  if (role.name === "Instructor") role.userCount = (db.instructors ?? []).length;
  if (role.name === "Student") role.userCount = db.users.filter((u) => u.role === "student").length;
}

for (const c of db.coupons ?? []) {
  c.usedCount = Math.min(c.usedCount ?? 0, 12);
}

for (const act of db.activities ?? []) {
  act.message = replaceCourseTitles(act.message);
  if (act.message.includes("Payment of ₹1,999")) {
    act.message = "Payment of ₹499 received from Kavita Singh";
  }
  if (act.message.includes("React JS Basics")) {
    act.message = "Live class 'UPSC Answer Writing' started";
  }
}

for (const log of db.systemLogs ?? []) {
  if (log.user === "john@navbharatgurukulam.com") log.user = "rajesh.kumar@navbharatgurukulam.com";
}

if (db.events?.[0]) {
  db.events[0].title = "Navbharat Research & Education Summit 2026";
  db.events[0].attendees = 120;
}

fs.writeFileSync(dbPath, `${JSON.stringify(db, null, 2)}\n`);
console.log("Migrated admin-db.json");
console.log(
  "Students:",
  db.users.filter((u) => u.role === "student").map((u) => u.email),
);
console.log(
  "Courses:",
  db.courses.map((c) => ({ title: c.title, enrollments: c.enrollments })),
);
