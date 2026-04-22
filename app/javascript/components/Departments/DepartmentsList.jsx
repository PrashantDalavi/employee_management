import React, { useState, useEffect, useRef } from "react";
import { fetchDepartments, fetchCountries, createDepartment, updateDepartment, deleteDepartment, bulkImportDepartments } from "../../services/api";
import Modal from "../common/Modal";

export default function DepartmentsList({ globalSearch }) {
  const [departments, setDepartments] = useState([]);
  const [countries, setCountries] = useState([]);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [showForm, setShowForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formData, setFormData] = useState({ name: "", code: "", country_id: "", description: "", active: true });
  const [formErrors, setFormErrors] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadDepartments();
    fetchCountries().then(setCountries).catch(() => setCountries([]));
  }, []);

  async function loadDepartments() {
    try {
      const data = await fetchDepartments();
      setDepartments(data);
    } catch {
      setDepartments([]);
    }
  }

  const activeSearch = globalSearch || search;

  const filtered = departments
    .filter(d => {
      if (activeSearch) {
        const q = activeSearch.toLowerCase();
        const matches = d.name.toLowerCase().includes(q) ||
          d.code.toLowerCase().includes(q) ||
          (d.description || "").toLowerCase().includes(q) ||
          (d.country?.name || "").toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (countryFilter && String(d.country?.id) !== countryFilter) return false;
      if (statusFilter === "active" && d.active === false) return false;
      if (statusFilter === "inactive" && d.active !== false) return false;
      return true;
    })
    .sort((a, b) => {
      let valA, valB;
      if (sortBy === "country_name") {
        valA = (a.country?.name || "").toLowerCase();
        valB = (b.country?.name || "").toLowerCase();
      } else {
        valA = typeof a[sortBy] === "string" ? a[sortBy].toLowerCase() : a[sortBy];
        valB = typeof b[sortBy] === "string" ? b[sortBy].toLowerCase() : b[sortBy];
      }
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

  function handleSort(col) {
    if (sortBy === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  }

  function renderSortIndicator(col) {
    if (sortBy !== col) return <span className="sort-indicator">↕</span>;
    return <span className="sort-indicator">{sortDir === "asc" ? "↑" : "↓"}</span>;
  }

  function handleAdd() {
    setEditingDepartment(null);
    setFormData({ name: "", code: "", country_id: "", description: "", active: true });
    setFormErrors([]);
    setShowForm(true);
  }

  function handleEdit(dept) {
    setEditingDepartment(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      country_id: dept.country_id || dept.country?.id || "",
      description: dept.description || "",
      active: dept.active !== false,
    });
    setFormErrors([]);
    setShowForm(true);
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    setFormErrors([]);
    try {
      if (editingDepartment) {
        await updateDepartment(editingDepartment.id, formData);
      } else {
        await createDepartment(formData);
      }
      setShowForm(false);
      setEditingDepartment(null);
      loadDepartments();
    } catch (err) {
      setFormErrors([err.message]);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteDepartment(deleteTarget.id);
      setDeleteTarget(null);
      loadDepartments();
    } catch (err) {
      setFormErrors([err.message]);
    }
  }

  function closeForm() {
    setShowForm(false);
    setEditingDepartment(null);
    setFormErrors([]);
  }

  async function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    try {
      const result = await bulkImportDepartments(file);
      setImportResult(result);
      loadDepartments();
    } catch (err) {
      setImportResult({ message: err.message, imported: 0, updated: 0, skipped: 0 });
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Departments</h2>
          <div className="page-header-subtitle">{filtered.length} departments</div>
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
          <button className="btn btn-primary" onClick={handleAdd}>+ Add Department</button>
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

      <div className="table-toolbar">
        <div className="table-search">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, code, description..."
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
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("id")}>ID {renderSortIndicator("id")}</th>
              <th onClick={() => handleSort("name")}>Name {renderSortIndicator("name")}</th>
              <th onClick={() => handleSort("code")}>Code {renderSortIndicator("code")}</th>
              <th onClick={() => handleSort("country_name")}>Country {renderSortIndicator("country_name")}</th>
              <th onClick={() => handleSort("description")}>Description {renderSortIndicator("description")}</th>
              <th onClick={() => handleSort("active")}>Status {renderSortIndicator("active")}</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="7"><div className="empty-state"><div className="empty-state-icon">🏢</div>No departments found</div></td></tr>
            ) : (
              filtered.map(d => (
                <tr key={d.id}>
                  <td>{d.id}</td>
                  <td className="cell-name">{d.name}</td>
                  <td><span className="cell-badge badge-engineering">{d.code}</span></td>
                  <td>{d.country?.name || "—"}</td>
                  <td>{d.description || "—"}</td>
                  <td>
                    <span className={`cell-badge ${d.active !== false ? "badge-finance" : "badge-hr"}`}>
                      {d.active !== false ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(d)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteTarget(d)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <Modal
          title={editingDepartment ? "Edit Department" : "Add Department"}
          onClose={closeForm}
          footer={
            <>
              <button className="btn btn-secondary" onClick={closeForm}>Cancel</button>
              <button className="btn btn-primary" onClick={handleFormSubmit}>
                {editingDepartment ? "Update" : "Create"}
              </button>
            </>
          }
        >
          {formErrors.length > 0 && (
            <div style={{ color: "var(--color-danger)", marginBottom: "var(--space-lg)", fontSize: "var(--font-size-sm)" }}>
              {formErrors.map((err, i) => <div key={i}>{err}</div>)}
            </div>
          )}
          <form onSubmit={handleFormSubmit}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" name="name" value={formData.name} onChange={handleFormChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Code</label>
              <input className="form-input" name="code" value={formData.code} onChange={handleFormChange} required maxLength={10} />
            </div>
            <div className="form-group">
              <label className="form-label">Country</label>
              <select className="form-input" name="country_id" value={formData.country_id} onChange={handleFormChange} required>
                <option value="">Select Country</option>
                {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-input" name="description" value={formData.description} onChange={handleFormChange} rows={3} />
            </div>
            <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
              <input type="checkbox" name="active" checked={formData.active} onChange={handleFormChange} id="dept-active" />
              <label htmlFor="dept-active" className="form-label" style={{ margin: 0 }}>Active</label>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <Modal
          title="Delete Department"
          onClose={() => setDeleteTarget(null)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
            </>
          }
        >
          <p className="confirm-text">
            Are you sure you want to delete <strong>{deleteTarget.name} ({deleteTarget.code})</strong>?
          </p>
        </Modal>
      )}
    </div>
  );
}
