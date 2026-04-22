// API service layer — currently uses dummy data, swap to real endpoints later
import { DUMMY_EMPLOYEES } from "../data/dummyData";

const API_BASE = "/api/v1";
const USE_DUMMY = true; // Toggle this to false when backend is ready

// Helper for real API calls (used when USE_DUMMY = false)
async function request(path, options = {}) {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
      ...options.headers,
    },
    ...options,
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Request failed: ${response.status}`);
  }
  return response.json();
}

// --- EMPLOYEES ---

export async function fetchEmployees({ page = 1, perPage = 25, search = "", countryId = "", departmentId = "", sortBy = "id", sortDir = "asc" } = {}) {
  if (USE_DUMMY) {
    let data = [...DUMMY_EMPLOYEES];

    // Filter
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(e =>
        `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        e.job_title.toLowerCase().includes(q)
      );
    }
    if (countryId) data = data.filter(e => e.country_id === Number(countryId));
    if (departmentId) data = data.filter(e => e.department_id === Number(departmentId));

    // Sort
    data.sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (typeof valA === "string") { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    // Paginate
    const total = data.length;
    const start = (page - 1) * perPage;
    const employees = data.slice(start, start + perPage);

    return { employees, total, page, per_page: perPage, total_pages: Math.ceil(total / perPage) };
  }

  const params = new URLSearchParams({ page, per_page: perPage, search, country_id: countryId, department_id: departmentId, sort_by: sortBy, sort_dir: sortDir });
  return request(`/employees?${params}`);
}

export async function fetchEmployee(id) {
  if (USE_DUMMY) {
    const emp = DUMMY_EMPLOYEES.find(e => e.id === Number(id));
    if (!emp) throw new Error("Employee not found");
    return emp;
  }
  return request(`/employees/${id}`);
}

export async function createEmployee(data) {
  if (USE_DUMMY) {
    const newId = Math.max(...DUMMY_EMPLOYEES.map(e => e.id)) + 1;
    const country = DUMMY_COUNTRIES.find(c => c.id === Number(data.country_id));
    const department = DUMMY_DEPARTMENTS.find(d => d.id === Number(data.department_id));
    const newEmp = {
      id: newId,
      ...data,
      country_name: country?.name || "",
      country_code: country?.code || "",
      department_name: department?.name || "",
    };
    DUMMY_EMPLOYEES.unshift(newEmp);
    return newEmp;
  }
  return request("/employees", { method: "POST", body: JSON.stringify({ employee: data }) });
}

export async function updateEmployee(id, data) {
  if (USE_DUMMY) {
    const idx = DUMMY_EMPLOYEES.findIndex(e => e.id === Number(id));
    if (idx === -1) throw new Error("Employee not found");
    const country = DUMMY_COUNTRIES.find(c => c.id === Number(data.country_id));
    const department = DUMMY_DEPARTMENTS.find(d => d.id === Number(data.department_id));
    DUMMY_EMPLOYEES[idx] = {
      ...DUMMY_EMPLOYEES[idx],
      ...data,
      country_name: country?.name || DUMMY_EMPLOYEES[idx].country_name,
      country_code: country?.code || DUMMY_EMPLOYEES[idx].country_code,
      department_name: department?.name || DUMMY_EMPLOYEES[idx].department_name,
    };
    return DUMMY_EMPLOYEES[idx];
  }
  return request(`/employees/${id}`, { method: "PATCH", body: JSON.stringify({ employee: data }) });
}

export async function deleteEmployee(id) {
  if (USE_DUMMY) {
    const idx = DUMMY_EMPLOYEES.findIndex(e => e.id === Number(id));
    if (idx !== -1) DUMMY_EMPLOYEES.splice(idx, 1);
    return { success: true };
  }
  return request(`/employees/${id}`, { method: "DELETE" });
}

// --- COUNTRIES ---

export async function fetchCountries() {
  const data = await request("/countries");
  return data.countries;
}

export async function createCountry(countryData) {
  return request("/countries", {
    method: "POST",
    body: JSON.stringify({ country: countryData }),
  });
}

export async function updateCountry(id, countryData) {
  return request(`/countries/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ country: countryData }),
  });
}

export async function deleteCountry(id) {
  return request(`/countries/${id}`, { method: "DELETE" });
}

export async function bulkImportCountries(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/countries/bulk_import`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.errors?.join(", ") || "Import failed");
  return data;
}

// --- DEPARTMENTS ---

export async function fetchDepartments() {
  const data = await request("/departments");
  return data.departments;
}

export async function createDepartment(departmentData) {
  return request("/departments", {
    method: "POST",
    body: JSON.stringify({ department: departmentData }),
  });
}

export async function updateDepartment(id, departmentData) {
  return request(`/departments/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ department: departmentData }),
  });
}

export async function deleteDepartment(id) {
  return request(`/departments/${id}`, { method: "DELETE" });
}

export async function bulkImportDepartments(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/departments/bulk_import`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.errors?.join(", ") || "Import failed");
  return data;
}

// --- SALARY INSIGHTS ---

export async function fetchSalaryInsights({ countryId = "" } = {}) {
  if (USE_DUMMY) {
    let data = [...DUMMY_EMPLOYEES];
    if (countryId) data = data.filter(e => e.country_id === Number(countryId));

    const salaries = data.map(e => e.salary);
    const sorted = [...salaries].sort((a, b) => a - b);

    // By country
    const byCountry = {};
    data.forEach(e => {
      if (!byCountry[e.country_name]) byCountry[e.country_name] = [];
      byCountry[e.country_name].push(e.salary);
    });

    const countryInsights = Object.entries(byCountry).map(([country, sals]) => ({
      country,
      min_salary: Math.min(...sals),
      max_salary: Math.max(...sals),
      avg_salary: Math.round(sals.reduce((a, b) => a + b, 0) / sals.length),
      employee_count: sals.length,
    }));

    // By job title
    const byJobTitle = {};
    data.forEach(e => {
      const key = `${e.job_title}|${e.country_name}`;
      if (!byJobTitle[key]) byJobTitle[key] = { job_title: e.job_title, country: e.country_name, salaries: [] };
      byJobTitle[key].salaries.push(e.salary);
    });

    const jobTitleInsights = Object.values(byJobTitle).map(item => ({
      job_title: item.job_title,
      country: item.country,
      avg_salary: Math.round(item.salaries.reduce((a, b) => a + b, 0) / item.salaries.length),
      employee_count: item.salaries.length,
    }));

    return {
      by_country: countryInsights.sort((a, b) => b.employee_count - a.employee_count),
      by_job_title: jobTitleInsights.sort((a, b) => b.avg_salary - a.avg_salary),
      overall: {
        total_employees: data.length,
        avg_salary: salaries.length ? Math.round(salaries.reduce((a, b) => a + b, 0) / salaries.length) : 0,
        min_salary: salaries.length ? Math.min(...salaries) : 0,
        max_salary: salaries.length ? Math.max(...salaries) : 0,
        total_departments: new Set(data.map(e => e.department_name)).size,
        total_countries: new Set(data.map(e => e.country_name)).size,
      },
    };
  }

  const params = new URLSearchParams();
  if (countryId) params.set("country_id", countryId);
  return request(`/salary_insights?${params}`);
}
