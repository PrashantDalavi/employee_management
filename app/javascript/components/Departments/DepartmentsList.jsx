import React, { useState, useEffect } from "react";
import { fetchDepartments } from "../../services/api";

export default function DepartmentsList({ globalSearch }) {
  const [departments, setDepartments] = useState([]);
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  const BADGE_MAP = {
    "Engineering": "badge-engineering",
    "Marketing": "badge-marketing",
    "Sales": "badge-sales",
    "Human Resources": "badge-hr",
    "Finance": "badge-finance",
    "Operations": "badge-operations",
    "Design": "badge-design",
    "Product": "badge-product",
  };

  useEffect(() => {
    fetchDepartments().then(setDepartments);
  }, []);

  const filtered = departments
    .filter(d => {
      if (!globalSearch) return true;
      return d.name.toLowerCase().includes(globalSearch.toLowerCase());
    })
    .sort((a, b) => {
      const valA = a[sortBy]?.toLowerCase?.() || a[sortBy];
      const valB = b[sortBy]?.toLowerCase?.() || b[sortBy];
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

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Departments</h2>
          <div className="page-header-subtitle">{filtered.length} departments</div>
        </div>
      </div>
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("id")}>ID {renderSortIndicator("id")}</th>
              <th onClick={() => handleSort("name")}>Name {renderSortIndicator("name")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="2"><div className="empty-state"><div className="empty-state-icon">🏢</div>No departments found</div></td></tr>
            ) : (
              filtered.map(d => (
                <tr key={d.id}>
                  <td>{d.id}</td>
                  <td><span className={`cell-badge ${BADGE_MAP[d.name] || ""}`}>{d.name}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
