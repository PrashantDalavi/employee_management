import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EmployeeList from "../../components/Employees/EmployeeList";
import * as api from "../../services/api";

jest.mock("../../services/api");

const mockCountries = [
  { id: 1, name: "India", code: "IN" },
  { id: 2, name: "United States", code: "US" },
];

const mockDepartments = [
  { id: 1, name: "Engineering", code: "ENG" },
  { id: 2, name: "Marketing", code: "MKT" },
];

const mockEmployees = [
  {
    id: 1, first_name: "John", last_name: "Doe", full_name: "John Doe",
    email: "john@company.com", job_title: "Software Engineer", employee_code: "EMP001",
    salary: 100000, currency: "USD", hire_date: "2023-01-15", active: true,
    department: { id: 1, name: "Engineering" }, country: { id: 2, name: "United States", code: "US" },
  },
  {
    id: 2, first_name: "Priya", last_name: "Patel", full_name: "Priya Patel",
    email: "priya@company.com", job_title: "Marketing Manager", employee_code: "EMP002",
    salary: 80000, currency: "INR", hire_date: "2022-06-01", active: true,
    department: { id: 2, name: "Marketing" }, country: { id: 1, name: "India", code: "IN" },
  },
];

function setupMocks() {
  api.fetchCountries.mockResolvedValue(mockCountries);
  api.fetchDepartments.mockResolvedValue(mockDepartments);
  api.fetchEmployees.mockResolvedValue({
    employees: mockEmployees,
    total: 2,
    total_pages: 1,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  setupMocks();
});

describe("EmployeeList", () => {
  test("renders employee table with data", async () => {
    render(<EmployeeList globalSearch="" />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
      expect(screen.getByText("Priya Patel")).toBeInTheDocument();
    });

    expect(screen.getByText("john@company.com")).toBeInTheDocument();
    expect(screen.getByText("Software Engineer")).toBeInTheDocument();
    expect(screen.getByText("2 total employees")).toBeInTheDocument();
  });

  test("renders country and department filter dropdowns", async () => {
    render(<EmployeeList globalSearch="" />);

    await waitFor(() => {
      expect(screen.getByText("All Countries")).toBeInTheDocument();
      expect(screen.getByText("All Departments")).toBeInTheDocument();
    });

    // Countries loaded from fetchCountries, not from employees
    expect(api.fetchCountries).toHaveBeenCalledTimes(1);
    expect(api.fetchDepartments).toHaveBeenCalledTimes(1);
  });

  test("does NOT fetch all employees for filter dropdowns", async () => {
    render(<EmployeeList globalSearch="" />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    // fetchEmployees should only be called once (for the paginated list),
    // NOT with perPage: 10000 for dropdown population
    const calls = api.fetchEmployees.mock.calls;
    calls.forEach(call => {
      expect(call[0].perPage).not.toBe(10000);
    });
  });

  test("shows empty state when no employees found", async () => {
    api.fetchEmployees.mockResolvedValue({
      employees: [],
      total: 0,
      total_pages: 1,
    });

    render(<EmployeeList globalSearch="" />);

    await waitFor(() => {
      expect(screen.getByText("No employees found")).toBeInTheDocument();
    });
  });

  test("calls fetchEmployees with search param from globalSearch", async () => {
    render(<EmployeeList globalSearch="john" />);

    await waitFor(() => {
      expect(api.fetchEmployees).toHaveBeenCalledWith(
        expect.objectContaining({ search: "john" })
      );
    });
  });

  test("opens Add Employee form when button clicked", async () => {
    const user = userEvent.setup();
    render(<EmployeeList globalSearch="" />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    await user.click(screen.getByText("+ Add Employee"));

    expect(screen.getByText("Add Employee")).toBeInTheDocument();
  });

  test("opens delete confirmation modal", async () => {
    const user = userEvent.setup();
    render(<EmployeeList globalSearch="" />);

    await waitFor(() => {
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText("Delete");
    await user.click(deleteButtons[0]);

    expect(screen.getByText(/Are you sure you want to delete/)).toBeInTheDocument();
    expect(screen.getByText("John Doe", { selector: "strong" })).toBeInTheDocument();
  });
});
