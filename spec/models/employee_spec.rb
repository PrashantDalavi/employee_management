require 'rails_helper'

RSpec.describe Employee, type: :model do
  describe 'validations' do
    subject { build(:employee) }

    it { should validate_presence_of(:first_name) }
    it { should validate_presence_of(:last_name) }
    it { should validate_presence_of(:email) }
    it { should validate_uniqueness_of(:email) }
    it { should validate_uniqueness_of(:employee_code) }
    it { should validate_presence_of(:job_title) }
    it { should validate_presence_of(:hire_date) }
    it { should validate_presence_of(:salary) }
    it { should validate_numericality_of(:salary).is_greater_than_or_equal_to(0) }
  end

  describe 'associations' do
    it { should belong_to(:department) }
    it { should belong_to(:country) }
  end

  describe '#full_name' do
    it 'returns first and last name combined' do
      employee = build(:employee, first_name: "Prashant", last_name: "Dalavi")
      expect(employee.full_name).to eq("Prashant Dalavi")
    end
  end

  describe '.search' do
    let!(:country) { create(:country, name: "India", code: "IN") }
    let!(:department) { create(:department, name: "Engineering", code: "ENG", country: country) }
    let!(:alice) { create(:employee, first_name: "Alice", last_name: "Smith", email: "alice@co.com", job_title: "Engineer", department: department, country: country) }
    let!(:bob) { create(:employee, first_name: "Bob", last_name: "Jones", email: "bob@co.com", job_title: "Designer", department: department, country: country) }

    it 'searches by first name' do
      expect(Employee.search("alice")).to include(alice)
      expect(Employee.search("alice")).not_to include(bob)
    end

    it 'searches by email' do
      expect(Employee.search("bob@co")).to include(bob)
    end

    it 'searches by job title' do
      expect(Employee.search("designer")).to include(bob)
    end

    it 'returns all when query is blank' do
      expect(Employee.search("")).to include(alice, bob)
      expect(Employee.search(nil)).to include(alice, bob)
    end
  end

  describe '.by_country' do
    let!(:india) { create(:country, name: "India", code: "IN") }
    let!(:germany) { create(:country, name: "Germany", code: "DE") }
    let!(:dept_in) { create(:department, name: "Engineering", code: "ENG", country: india) }
    let!(:dept_de) { create(:department, name: "Engineering", code: "ENGDE", country: germany) }
    let!(:emp_in) { create(:employee, email: "a@co.com", department: dept_in, country: india) }
    let!(:emp_de) { create(:employee, email: "b@co.com", department: dept_de, country: germany) }

    it 'filters by country_id' do
      expect(Employee.by_country(india.id)).to include(emp_in)
      expect(Employee.by_country(india.id)).not_to include(emp_de)
    end

    it 'returns all when blank' do
      expect(Employee.by_country("")).to include(emp_in, emp_de)
    end
  end

  describe '.by_department' do
    let!(:country) { create(:country, name: "India", code: "IN") }
    let!(:country2) { create(:country, name: "Germany", code: "DE") }
    let!(:eng_in) { create(:department, name: "Engineering", code: "ENG1", country: country) }
    let!(:eng_de) { create(:department, name: "Engineering", code: "ENG2", country: country2) }
    let!(:sales) { create(:department, name: "Sales", code: "SAL", country: country) }
    let!(:emp1) { create(:employee, email: "a@co.com", department: eng_in, country: country) }
    let!(:emp2) { create(:employee, email: "b@co.com", department: eng_de, country: country2) }
    let!(:emp3) { create(:employee, email: "c@co.com", department: sales, country: country) }

    it 'filters by department name across all countries' do
      result = Employee.by_department("Engineering")
      expect(result).to include(emp1, emp2)
      expect(result).not_to include(emp3)
    end

    it 'returns all when blank' do
      expect(Employee.by_department("")).to include(emp1, emp2, emp3)
    end
  end

  describe '.sorted' do
    let!(:country) { create(:country, name: "India", code: "IN") }
    let!(:department) { create(:department, name: "Engineering", code: "ENG", country: country) }
    let!(:high) { create(:employee, email: "h@co.com", salary: 200000, first_name: "Zara", department: department, country: country) }
    let!(:low) { create(:employee, email: "l@co.com", salary: 50000, first_name: "Alice", department: department, country: country) }

    it 'sorts by salary ascending' do
      result = Employee.sorted("salary", "asc")
      expect(result.first).to eq(low)
    end

    it 'sorts by salary descending' do
      result = Employee.sorted("salary", "desc")
      expect(result.first).to eq(high)
    end

    it 'falls back to id for invalid column' do
      expect(Employee.sorted("malicious_col", "asc").to_sql).to include("id asc")
    end

    it 'falls back to asc for invalid direction' do
      expect(Employee.sorted("salary", "DROP").to_sql).to include("salary asc")
    end
  end

  describe '.filter' do
    let!(:india) { create(:country, name: "India", code: "IN") }
    let!(:germany) { create(:country, name: "Germany", code: "DE") }
    let!(:eng_in) { create(:department, name: "Engineering", code: "ENG1", country: india) }
    let!(:sales_de) { create(:department, name: "Sales", code: "SAL", country: germany) }
    let!(:emp1) { create(:employee, first_name: "Alice", email: "a@co.com", department: eng_in, country: india, salary: 100000) }
    let!(:emp2) { create(:employee, first_name: "Bob", email: "b@co.com", department: sales_de, country: germany, salary: 80000) }

    it 'chains all filters together' do
      result = Employee.filter(search: "alice", country_id: india.id, department_name: "Engineering")
      expect(result).to include(emp1)
      expect(result).not_to include(emp2)
    end

    it 'returns all with empty params' do
      result = Employee.filter({})
      expect(result).to include(emp1, emp2)
    end
  end
end
