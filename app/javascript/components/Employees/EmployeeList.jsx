import React, { useState, useEffect, useMemo } from "react";
import { fetchEmployees, deleteEmployee, fetchCountries, fetchDepartments } from "../../services/api";
import Pagination from "../common/Pagination";
import EmployeeForm from "./EmployeeForm";
import Modal from "../common/Modal";

const DEPARTMENT_BADGE_MAP = {
  "Engineering": "badge-engineering",
  "Marketing": "badge-marketing",
  "Sales": "badge-sales",
  "Human Resources": "badge-hr",
  "Finance": "badge-finance",
  "Operations": "badge-operations",
  "Design": "badge-design",
  "Product": "badge-product",
};

const QUICK_FILTERS = [
  { label: "All", value: "" },
  { label: "High Salary (>150k)", value: "high_salary" },
  { label: "Recent Hires", value: "recent" },
  { label: "Engineering", value: "dept_engineering" },
  { label: "Sales", value: "dept_sales" },
  { label: "Marketing", value: "dept_marketing" },
];

export default function EmployeeList({ globalSearch }) {
  const [employees, setEmployees] = useState([]);
  const [countries, setCountries] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState("asc");
  const [quickFilter, setQuickFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Use global search if provided, else local search
  const activeSearch = globalSearch || search;

  useEffect(() => {
    fetchCountries().then(setCountries);
    fetchDepartments().then(setDepartments);
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [page, activeSearch, countryFilter, departmentFilter, sortBy, sortDir]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [activeSearch, countryFilter, departmentFilter]);

  async function loadEmployees() {
    const result = await fetchEmployees({
      page, perPage, search: activeSearch,
      countryId: countryFilter, departmentId: departmentFilter,
      sortBy, sortDir,
    });
    setEmployees(result.employees);
    setTotal(result.total);
    setTotalPages(result.total_pages);
  }

  // Apply quick filters on client side
  const filteredEmployees = useMemo(() => {
    let data = [...employees];
    if (quickFilter === "high_salary") {
      data = data.filter(e => e.salary > 150000);
    } else if (quickFilter === "recent") {
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 2);
      data = data.filter(e => new Date(e.hire_date) >= cutoff);
    } else if (quickFilter.startsWith("dept_")) {
      const dept = quickFilter.replace("dept_", "");
      data = data.filter(e => e.department_name.toLowerCase() === dept);
    }
    return data;
  }, [employees, quickFilter]);

  function handleSort(column) {
    if (sortBy === column) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDir("asc");
    }
  }

  function renderSortIndicator(column) {
    if (sortBy !== column) return <span className="sort-indicator">↕</span>;
    return <span className="sort-indicator">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  function handleAdd() {
    setEditingEmployee(null);
    setShowForm(true);
  }

  function handleEdit(emp) {
    setEditingEmployee(emp);
    setShowForm(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await deleteEmployee(deleteTarget.id);
    setDeleteTarget(null);
    loadEmployees();
  }

  function handleFormSave() {
    setShowForm(false);
    setEditingEmployee(null);
    loadEmployees();
  }

  function formatSalary(val) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(val);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Employees</h2>
          <div className="page-header-subtitle">{total} total employees</div>
        </div>
        <button className="btn btn-primary" onClick={handleAdd}>+ Add Employee</button>
      </div>

      {/* Quick Filter Buttons */}
      <div className="quick-filters">
        {QUICK_FILTERS.map(f => (
          <button
            key={f.value}
            className={`quick-filter-btn ${quickFilter === f.value ? "active" : ""}`}
            onClick={() => setQuickFilter(f.value === quickFilter ? "" : f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table Toolbar */}
      <div className="table-toolbar">
        <div className="table-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, email, title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="table-filter-select"
          value={countryFilter}
          onChange={e => setCountryFilter(e.target.value)}
        >
          <option value="">All Countries</option>
          {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select
          className="table-filter-select"
          value={departmentFilter}
          onChange={e => setDepartmentFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>

      {/* Data Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th className={sortBy === "id" ? "sorted" : ""} onClick={() => handleSort("id")}>
                ID {renderSortIndicator("id")}
              </th>
              <th className={sortBy === "first_name" ? "sorted" : ""} onClick={() => handleSort("first_name")}>
                Name {renderSortIndicator("first_name")}
              </th>
              <th className={sortBy === "email" ? "sorted" : ""} onClick={() => handleSort("email")}>
                Email {renderSortIndicator("email")}
              </th>
              <th className={sortBy === "job_title" ? "sorted" : ""} onClick={() => handleSort("job_title")}>
                Job Title {renderSortIndicator("job_title")}
              </th>
              <th className={sortBy === "department_name" ? "sorted" : ""} onClick={() => handleSort("department_name")}>
                Department {renderSortIndicator("department_name")}
              </th>
              <th className={sortBy === "country_name" ? "sorted" : ""} onClick={() => handleSort("country_name")}>
                Country {renderSortIndicator("country_name")}
              </th>
              <th className={sortBy === "salary" ? "sorted" : ""} onClick={() => handleSort("salary")}>
                Salary {renderSortIndicator("salary")}
              </th>
              <th className={sortBy === "hire_date" ? "sorted" : ""} onClick={() => handleSort("hire_date")}>
                Hire Date {renderSortIndicator("hire_date")}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan="9">
                  <div className="empty-state">
                    <div className="empty-state-icon">📭</div>
                    No employees found
                  </div>
                </td>
              </tr>
            ) : (
              filteredEmployees.map(emp => (
                <tr key={emp.id}>
                  <td>{emp.id}</td>
                  <td className="cell-name">{emp.first_name} {emp.last_name}</td>
                  <td className="cell-email">{emp.email}</td>
                  <td>{emp.job_title}</td>
                  <td>
                    <span className={`cell-badge ${DEPARTMENT_BADGE_MAP[emp.department_name] || ""}`}>
                      {emp.department_name}
                    </span>
                  </td>
                  <td>{emp.country_name}</td>
                  <td className="cell-salary">{formatSalary(emp.salary)}</td>
                  <td>{emp.hire_date}</td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(emp)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(emp)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          perPage={perPage}
          onPageChange={setPage}
        />
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <EmployeeForm
          employee={editingEmployee}
          countries={countries}
          departments={departments}
          onSave={handleFormSave}
          onClose={() => { setShowForm(false); setEditingEmployee(null); }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal
          title="Delete Employee"
          onClose={() => setDeleteTarget(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </>
          }
        >
          <p className="confirm-text">
            Are you sure you want to delete <strong>{deleteTarget.first_name} {deleteTarget.last_name}</strong>? This action cannot be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}
