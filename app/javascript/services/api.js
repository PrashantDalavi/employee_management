// API service layer — real API endpoints

const API_BASE = "/api/v1";

// Helper for API calls
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
    throw new Error(error.errors?.join(", ") || error.message || `Request failed: ${response.status}`);
  }
  return response.json();
}

// --- EMPLOYEES ---

export async function fetchEmployees({ page = 1, perPage = 25, search = "", countryId = "", departmentName = "", sortBy = "id", sortDir = "asc" } = {}) {
  const params = new URLSearchParams({ page, per_page: perPage, search, country_id: countryId, department_name: departmentName, sort_by: sortBy, sort_dir: sortDir });
  return request(`/employees?${params}`);
}

export async function fetchEmployee(id) {
  return request(`/employees/${id}`);
}

export async function createEmployee(data) {
  return request("/employees", { method: "POST", body: JSON.stringify({ employee: data }) });
}

export async function updateEmployee(id, data) {
  return request(`/employees/${id}`, { method: "PATCH", body: JSON.stringify({ employee: data }) });
}

export async function deleteEmployee(id) {
  return request(`/employees/${id}`, { method: "DELETE" });
}

export async function bulkImportEmployees(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE}/employees/bulk_import`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.errors?.join(", ") || "Import failed");
  return data;
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
  // Fetch all employees for insights (large page)
  const result = await fetchEmployees({ page: 1, perPage: 10000, countryId });
  const data = result.employees;

  const salaries = data.map(e => parseFloat(e.salary));

  // By country
  const byCountry = {};
  data.forEach(e => {
    const name = e.country?.name || "Unknown";
    if (!byCountry[name]) byCountry[name] = [];
    byCountry[name].push(parseFloat(e.salary));
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
    const countryName = e.country?.name || "Unknown";
    const key = `${e.job_title}|${countryName}`;
    if (!byJobTitle[key]) byJobTitle[key] = { job_title: e.job_title, country: countryName, salaries: [] };
    byJobTitle[key].salaries.push(parseFloat(e.salary));
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
      total_departments: new Set(data.map(e => e.department?.name).filter(Boolean)).size,
      total_countries: new Set(data.map(e => e.country?.name).filter(Boolean)).size,
    },
  };
}

