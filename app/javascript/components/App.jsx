import React, { useState } from "react";
import Sidebar from "./Layout/Sidebar";
import Header from "./Layout/Header";
import EmployeeList from "./Employees/EmployeeList";
import CountriesList from "./Countries/CountriesList";
import DepartmentsList from "./Departments/DepartmentsList";
import InsightsDashboard from "./Insights/InsightsDashboard";

export default function App() {
  const [activeView, setActiveView] = useState("employees");
  const [globalSearch, setGlobalSearch] = useState("");

  function renderContent() {
    switch (activeView) {
      case "employees":
        return <EmployeeList globalSearch={globalSearch} />;
      case "countries":
        return <CountriesList globalSearch={globalSearch} />;
      case "departments":
        return <DepartmentsList globalSearch={globalSearch} />;
      case "insights":
        return <InsightsDashboard />;
      default:
        return <EmployeeList globalSearch={globalSearch} />;
    }
  }

  return (
    <div className="app-layout">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />
      <div className="main-content">
        <Header
          globalSearch={globalSearch}
          onGlobalSearchChange={setGlobalSearch}
        />
        <div className="page-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
