import React, { useState, useEffect } from "react";
import { createEmployee, updateEmployee } from "../../services/api";
import Modal from "../common/Modal";

export default function EmployeeForm({ employee, countries, departments, onSave, onClose }) {
  const isEdit = !!employee;

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    job_title: "",
    salary: "",
    country_id: "",
    department_id: "",
    hire_date: "",
  });

  useEffect(() => {
    if (employee) {
      setForm({
        first_name: employee.first_name || "",
        last_name: employee.last_name || "",
        email: employee.email || "",
        job_title: employee.job_title || "",
        salary: employee.salary || "",
        country_id: employee.country_id || "",
        department_id: employee.department_id || "",
        hire_date: employee.hire_date || "",
      });
    }
  }, [employee]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const data = { ...form, salary: parseFloat(form.salary), country_id: parseInt(form.country_id), department_id: parseInt(form.department_id) };

    if (isEdit) {
      await updateEmployee(employee.id, data);
    } else {
      await createEmployee(data);
    }
    onSave();
  }

  return (
    <Modal
      title={isEdit ? "Edit Employee" : "Add Employee"}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>
            {isEdit ? "Update" : "Create"}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input className="form-input" name="first_name" value={form.first_name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input className="form-input" name="last_name" value={form.last_name} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Email</label>
          <input className="form-input" name="email" type="email" value={form.email} onChange={handleChange} required />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Job Title</label>
            <input className="form-input" name="job_title" value={form.job_title} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Salary ($)</label>
            <input className="form-input" name="salary" type="number" step="0.01" min="0" value={form.salary} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Country</label>
            <select className="form-select" name="country_id" value={form.country_id} onChange={handleChange} required>
              <option value="">Select Country</option>
              {countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Department</label>
            <select className="form-select" name="department_id" value={form.department_id} onChange={handleChange} required>
              <option value="">Select Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Hire Date</label>
          <input className="form-input" name="hire_date" type="date" value={form.hire_date} onChange={handleChange} required />
        </div>
      </form>
    </Modal>
  );
}
