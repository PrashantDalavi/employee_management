import React, { useState } from "react";
import { createEmployee, updateEmployee } from "../../services/api";
import Modal from "../common/Modal";

export default function EmployeeForm({ employee, countries, departments, onSave, onClose }) {
  const [formData, setFormData] = useState({
    first_name: employee?.first_name || "",
    last_name: employee?.last_name || "",
    email: employee?.email || "",
    phone: employee?.phone || "",
    employee_code: employee?.employee_code || "",
    department_id: employee?.department_id || employee?.department?.id || "",
    country_id: employee?.country_id || employee?.country?.id || "",
    job_title: employee?.job_title || "",
    hire_date: employee?.hire_date || "",
    salary: employee?.salary || "",
    currency: employee?.currency || "USD",
    active: employee?.active !== false,
  });
  const [errors, setErrors] = useState([]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors([]);
    try {
      if (employee) {
        await updateEmployee(employee.id, formData);
      } else {
        await createEmployee(formData);
      }
      onSave();
    } catch (err) {
      setErrors([err.message]);
    }
  }

  return (
    <Modal
      title={employee ? "Edit Employee" : "Add Employee"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {employee ? "Update" : "Create"}
          </button>
        </>
      }
    >
      {errors.length > 0 && (
        <div style={{ color: "var(--color-danger)", marginBottom: "var(--space-lg)", fontSize: "var(--font-size-sm)" }}>
          {errors.map((err, i) => <div key={i}>{err}</div>)}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input className="form-input" name="first_name" value={formData.first_name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input className="form-input" name="last_name" value={formData.last_name} onChange={handleChange} required />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" name="email" type="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" name="phone" value={formData.phone} onChange={handleChange} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
          <div className="form-group">
            <label className="form-label">Employee Code</label>
            <input className="form-input" name="employee_code" value={formData.employee_code} onChange={handleChange} placeholder="EMP001" />
          </div>
          <div className="form-group">
            <label className="form-label">Job Title</label>
            <input className="form-input" name="job_title" value={formData.job_title} onChange={handleChange} required />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-md)" }}>
          <div className="form-group">
            <label className="form-label">Country</label>
            <select className="form-input" name="country_id" value={formData.country_id} onChange={handleChange} required>
              <option value="">Select Country</option>
              {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Department</label>
            <select className="form-input" name="department_id" value={formData.department_id} onChange={handleChange} required>
              <option value="">Select Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.country?.name || ""})</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-md)" }}>
          <div className="form-group">
            <label className="form-label">Salary</label>
            <input className="form-input" name="salary" type="number" step="0.01" min="0" value={formData.salary} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Currency</label>
            <select className="form-input" name="currency" value={formData.currency} onChange={handleChange}>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="INR">INR</option>
              <option value="JPY">JPY</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Hire Date</label>
            <input className="form-input" name="hire_date" type="date" value={formData.hire_date} onChange={handleChange} required />
          </div>
        </div>
        <div className="form-group" style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)" }}>
          <input type="checkbox" name="active" checked={formData.active} onChange={handleChange} id="emp-active" />
          <label htmlFor="emp-active" className="form-label" style={{ margin: 0 }}>Active</label>
        </div>
      </form>
    </Modal>
  );
}
