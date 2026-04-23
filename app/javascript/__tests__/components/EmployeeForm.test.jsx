import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmployeeForm from "../../components/Employees/EmployeeForm";
import * as api from "../../services/api";

jest.mock("../../services/api");

const mockCountries = [
  { id: 1, name: "India", code: "IN" },
  { id: 2, name: "United States", code: "US" },
];

const mockDepartments = [
  { id: 1, name: "Engineering", code: "ENG", country: { id: 1, name: "India" } },
  { id: 2, name: "Marketing", code: "MKT", country: { id: 2, name: "United States" } },
];

beforeEach(() => {
  jest.clearAllMocks();
});

function renderForm(employee = null, overrides = {}) {
  return render(
    <EmployeeForm
      employee={employee}
      countries={mockCountries}
      departments={mockDepartments}
      onSave={overrides.onSave || jest.fn()}
      onClose={overrides.onClose || jest.fn()}
    />
  );
}

// Helper: get input by its label text via the form-label class
function getInputByLabel(labelText) {
  const label = screen.getByText(labelText, { selector: ".form-label" });
  const group = label.closest(".form-group");
  return group.querySelector("input, select, textarea");
}

describe("EmployeeForm", () => {
  test("renders Add Employee form with all required fields", () => {
    renderForm();

    expect(screen.getByText("Add Employee")).toBeInTheDocument();
    expect(screen.getByText("First Name")).toBeInTheDocument();
    expect(screen.getByText("Last Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("Job Title")).toBeInTheDocument();
    expect(screen.getByText("Salary")).toBeInTheDocument();
    expect(screen.getByText("Hire Date")).toBeInTheDocument();
    expect(screen.getByText("Country")).toBeInTheDocument();
    expect(screen.getByText("Department")).toBeInTheDocument();
    expect(screen.getByText("Create")).toBeInTheDocument();
  });

  test("renders Edit Employee form with pre-filled data", () => {
    const employee = {
      id: 1, first_name: "John", last_name: "Doe", email: "john@company.com",
      phone: "1234567890", employee_code: "EMP001", job_title: "Software Engineer",
      hire_date: "2023-01-15", salary: 100000, currency: "USD", active: true,
      department: { id: 1, name: "Engineering" }, country: { id: 2, name: "United States" },
    };

    renderForm(employee);

    expect(screen.getByText("Edit Employee")).toBeInTheDocument();
    expect(screen.getByDisplayValue("John")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("john@company.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Software Engineer")).toBeInTheDocument();
    expect(screen.getByText("Update")).toBeInTheDocument();
  });

  test("calls createEmployee on submit for new employee", async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    api.createEmployee.mockResolvedValue({ id: 3 });

    renderForm(null, { onSave });

    await user.type(getInputByLabel("First Name"), "Jane");
    await user.type(getInputByLabel("Last Name"), "Smith");
    await user.type(getInputByLabel("Email"), "jane@company.com");
    await user.type(getInputByLabel("Job Title"), "Designer");
    await user.type(getInputByLabel("Salary"), "90000");
    await user.type(getInputByLabel("Hire Date"), "2024-01-01");
    await user.selectOptions(getInputByLabel("Country"), "1");
    await user.selectOptions(getInputByLabel("Department"), "1");

    await user.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(api.createEmployee).toHaveBeenCalledTimes(1);
      expect(onSave).toHaveBeenCalled();
    });
  });

  test("calls updateEmployee on submit for existing employee", async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    api.updateEmployee.mockResolvedValue({ id: 1 });

    const employee = {
      id: 1, first_name: "John", last_name: "Doe", email: "john@company.com",
      phone: "", employee_code: "EMP001", job_title: "Engineer",
      hire_date: "2023-01-15", salary: 100000, currency: "USD", active: true,
      department: { id: 1 }, country: { id: 2 },
    };

    renderForm(employee, { onSave });

    await user.click(screen.getByText("Update"));

    await waitFor(() => {
      expect(api.updateEmployee).toHaveBeenCalledWith(1, expect.any(Object));
      expect(onSave).toHaveBeenCalled();
    });
  });

  test("displays API errors on failed submit", async () => {
    const user = userEvent.setup();
    api.createEmployee.mockRejectedValue(new Error("Email has already been taken"));

    renderForm();

    await user.type(getInputByLabel("First Name"), "Jane");
    await user.type(getInputByLabel("Last Name"), "Smith");
    await user.type(getInputByLabel("Email"), "john@company.com");
    await user.type(getInputByLabel("Job Title"), "Designer");
    await user.type(getInputByLabel("Salary"), "90000");
    await user.type(getInputByLabel("Hire Date"), "2024-01-01");
    await user.selectOptions(getInputByLabel("Country"), "1");
    await user.selectOptions(getInputByLabel("Department"), "1");

    await user.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(screen.getByText("Email has already been taken")).toBeInTheDocument();
    });
  });

  test("calls onClose when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    renderForm(null, { onClose });

    await user.click(screen.getByText("Cancel"));
    expect(onClose).toHaveBeenCalled();
  });
});
