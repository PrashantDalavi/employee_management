// Dummy data for development — will be replaced with real API calls

// Used internally for generating dummy employees only (not exported)
const DUMMY_DEPARTMENTS = [
  { id: 1, name: "Engineering" },
  { id: 2, name: "Marketing" },
  { id: 3, name: "Sales" },
  { id: 4, name: "Human Resources" },
  { id: 5, name: "Finance" },
  { id: 6, name: "Operations" },
  { id: 7, name: "Design" },
  { id: 8, name: "Product" },
];

const JOB_TITLES = [
  "Software Engineer", "Senior Software Engineer", "Staff Engineer",
  "Product Manager", "Senior Product Manager", "Marketing Manager",
  "Sales Representative", "Account Executive", "HR Specialist",
  "Financial Analyst", "Senior Financial Analyst", "Operations Manager",
  "UX Designer", "Senior UX Designer", "Data Scientist",
  "DevOps Engineer", "QA Engineer", "Technical Lead",
  "Business Analyst", "Project Manager"
];

const FIRST_NAMES = [
  "James", "Mary", "Robert", "Patricia", "John", "Jennifer", "Michael", "Linda",
  "David", "Elizabeth", "William", "Barbara", "Richard", "Susan", "Joseph", "Jessica",
  "Thomas", "Sarah", "Christopher", "Karen", "Priya", "Rahul", "Aisha", "Chen",
  "Yuki", "Hans", "Marie", "Carlos", "Fatima", "Ahmed"
];

const LAST_NAMES = [
  "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis",
  "Rodriguez", "Martinez", "Anderson", "Taylor", "Thomas", "Hernandez", "Moore",
  "Martin", "Jackson", "Thompson", "White", "Lopez", "Patel", "Kumar", "Singh",
  "Weber", "Müller", "Tanaka", "Wang", "Kim", "Nakamura", "Ali"
];

function generateDummyEmployees(count) {
  const employees = [];
  for (let i = 1; i <= count; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    const department = DUMMY_DEPARTMENTS[Math.floor(Math.random() * DUMMY_DEPARTMENTS.length)];
    const jobTitle = JOB_TITLES[Math.floor(Math.random() * JOB_TITLES.length)];
    const salary = Math.round((30000 + Math.random() * 220000) * 100) / 100;
    const year = 2015 + Math.floor(Math.random() * 11);
    const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, "0");
    const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, "0");

    employees.push({
      id: i,
      first_name: firstName,
      last_name: lastName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@company.com`,
      job_title: jobTitle,
      salary: salary,
      country_id: null,
      country_name: "",
      country_code: "",
      department_id: department.id,
      department_name: department.name,
      hire_date: `${year}-${month}-${day}`,
    });
  }
  return employees;
}

export const DUMMY_EMPLOYEES = generateDummyEmployees(150);
