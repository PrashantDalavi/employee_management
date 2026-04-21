import React, { useState, useEffect } from "react";
import { fetchCountries } from "../../services/api";

export default function CountriesList({ globalSearch }) {
  const [countries, setCountries] = useState([]);
  const [sortBy, setSortBy] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  useEffect(() => {
    fetchCountries().then(setCountries);
  }, []);

  const filtered = countries
    .filter(c => {
      if (!globalSearch) return true;
      const q = globalSearch.toLowerCase();
      return c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q);
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
          <h2>Countries</h2>
          <div className="page-header-subtitle">{filtered.length} countries</div>
        </div>
      </div>
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("id")}>ID {renderSortIndicator("id")}</th>
              <th onClick={() => handleSort("name")}>Name {renderSortIndicator("name")}</th>
              <th onClick={() => handleSort("code")}>Code {renderSortIndicator("code")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan="3"><div className="empty-state"><div className="empty-state-icon">🌍</div>No countries found</div></td></tr>
            ) : (
              filtered.map(c => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td className="cell-name">{c.name}</td>
                  <td><span className="cell-badge badge-engineering">{c.code}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
