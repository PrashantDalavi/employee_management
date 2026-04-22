import React, { useState, useEffect, useMemo, useRef } from "react";
import { fetchEmployees, deleteEmployee, fetchCountries, fetchDepartments, bulkImportEmployees } from "../../services/api";
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
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  const activeSearch = globalSearch || search;

  // Derive unique filter options from all employees (unfilterd fetch)
  useEffect(() => {
    fetchEmployees({ page: 1, perPage: 10000 })
      .then(result => {
        const emps = result.employees || [];
        // Unique countries that have employees
        const countryMap = new Map();
        emps.forEach(e => {
          if (e.country?.id && !countryMap.has(e.country.id)) {
            countryMap.set(e.country.id, e.country);
          }
        });
        setCountries([...countryMap.values()].sort((a, b) => a.name.localeCompare(b.name)));
        // Unique departments by name
        const deptMap = new Map();
        emps.forEach(e => {
          if (e.department?.id && !deptMap.has(e.department.name)) {
            deptMap.set(e.department.name, e.department);
          }
        });
        setDepartments([...deptMap.values()].sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch(() => { setCountries([]); setDepartments([]); });
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [page, activeSearch, countryFilter, departmentFilter, sortBy, sortDir]);

  useEffect(() => {
    setPage(1);
  }, [activeSearch, countryFilter, departmentFilter]);

  async function loadEmployees() {
    try {
      const result = await fetchEmployees({
        page, perPage, search: activeSearch,
        countryId: countryFilter, departmentName: departmentFilter,
        sortBy, sortDir,
      });
      setEmployees(result.employees);
      setTotal(result.total);
      setTotalPages(result.total_pages);
    } catch {
      setEmployees([]);
      setTotal(0);
      setTotalPages(1);
    }
  }

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

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const result = await bulkImportEmployees(file);
      setImportResult(result);
      loadEmployees();
    } catch (err) {
      setImportResult({ message: err.message, imported: 0, updated: 0, skipped: 0 });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function formatSalary(val, currency = "USD") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD", minimumFractionDigits: 0 }).format(val);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Employees</h2>
          <div className="page-header-subtitle">{total} total employees</div>
        </div>
        <div style={{ display: "flex", gap: "var(--space-sm)" }}>
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv,.xlsx,.xls"
            onChange={handleImport}
            style={{ display: "none" }}
          />
          <button
            className="btn btn-secondary"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? "Importing..." : "📥 Import CSV/Excel"}
          </button>
          <button className="btn btn-primary" onClick={handleAdd}>+ Add Employee</button>
        </div>
      </div>

      {importResult && (
        <div style={{
          padding: "var(--space-md) var(--space-lg)",
          marginBottom: "var(--space-lg)",
          borderRadius: "var(--radius-md)",
          fontSize: "var(--font-size-sm)",
          background: importResult.imported > 0 || importResult.updated > 0 ? "#ecfdf5" : "#fef2f2",
          color: importResult.imported > 0 || importResult.updated > 0 ? "#065f46" : "#991b1b",
          border: `1px solid ${importResult.imported > 0 || importResult.updated > 0 ? "#a7f3d0" : "#fecaca"}`
        }}>
          {importResult.message} — Imported: {importResult.imported}, Updated: {importResult.updated || 0}, Skipped: {importResult.skipped}
          {importResult.errors?.length > 0 && (
            <div style={{ marginTop: "var(--space-xs)" }}>
              {importResult.errors.map((err, i) => <div key={i}>• {err}</div>)}
            </div>
          )}
        </div>
      )}

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
          {countries.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
        </select>
        <select
          className="table-filter-select"
          value={departmentFilter}
          onChange={e => setDepartmentFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
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
              <th className={sortBy === "employee_code" ? "sorted" : ""} onClick={() => handleSort("employee_code")}>
                Code {renderSortIndicator("employee_code")}
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
              <th>Department</th>
              <th>Country</th>
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
            {employees.length === 0 ? (
              <tr>
                <td colSpan="10">
                  <div className="empty-state">
                    <div className="empty-state-icon">📭</div>
                    No employees found
                  </div>
                </td>
              </tr>
            ) : (
              employees.map(emp => (
                <tr key={emp.id}>
                  <td>{emp.id}</td>
                  <td><span className="cell-badge badge-engineering">{emp.employee_code || "—"}</span></td>
                  <td className="cell-name">{emp.full_name || `${emp.first_name} ${emp.last_name}`}</td>
                  <td className="cell-email">{emp.email}</td>
                  <td>{emp.job_title}</td>
                  <td>
                    <span className={`cell-badge ${DEPARTMENT_BADGE_MAP[emp.department?.name] || ""}`}>
                      {emp.department?.name || "—"}
                    </span>
                  </td>
                  <td>{emp.country?.name || "—"}</td>
                  <td className="cell-salary">{formatSalary(emp.salary, emp.currency)}</td>
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
