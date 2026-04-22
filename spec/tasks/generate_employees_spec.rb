require 'rails_helper'
require 'rake'

RSpec.describe 'employees:generate_csv', type: :task do
  let(:output_path) { Rails.root.join("sample_files", "employees_bulk.csv") }

  before do
    Rails.application.load_tasks if Rake::Task.tasks.empty?
    Rake::Task['employees:generate_csv'].reenable
  end

  after do
    File.delete(output_path) if File.exist?(output_path)
  end

  context 'when countries and departments exist' do
    let!(:country) { create(:country, name: "India", code: "IN") }
    let!(:department) { create(:department, name: "Engineering", code: "ENG", country: country) }

    it 'generates a CSV file with the specified number of records' do
      Rake::Task['employees:generate_csv'].invoke(100)
      expect(File.exist?(output_path)).to be true

      rows = CSV.read(output_path)
      header = rows.first
      data_rows = rows[1..]

      expect(data_rows.size).to eq(100)
    end

    it 'generates CSV with correct headers' do
      Rake::Task['employees:generate_csv'].invoke(5)
      rows = CSV.read(output_path)
      expected_headers = %w[first_name last_name email phone employee_code job_title salary currency hire_date country_code department_code active]
      expect(rows.first).to eq(expected_headers)
    end

    it 'generates unique emails' do
      Rake::Task['employees:generate_csv'].invoke(500)
      rows = CSV.read(output_path)
      emails = rows[1..].map { |r| r[2] }
      expect(emails.uniq.size).to eq(500)
    end

    it 'generates unique employee codes' do
      Rake::Task['employees:generate_csv'].invoke(100)
      rows = CSV.read(output_path)
      codes = rows[1..].map { |r| r[4] }
      expect(codes.uniq.size).to eq(100)
    end

    it 'uses valid country codes' do
      Rake::Task['employees:generate_csv'].invoke(50)
      rows = CSV.read(output_path)
      country_codes = rows[1..].map { |r| r[9] }.uniq
      expect(country_codes).to all(eq("IN"))
    end

    it 'uses valid department codes' do
      Rake::Task['employees:generate_csv'].invoke(50)
      rows = CSV.read(output_path)
      dept_codes = rows[1..].map { |r| r[10] }.uniq
      expect(dept_codes).to all(eq("ENG"))
    end

    it 'defaults to 10000 records when no count is provided' do
      Rake::Task['employees:generate_csv'].invoke
      rows = CSV.read(output_path)
      expect(rows[1..].size).to eq(10_000)
    end
  end

  context 'when no departments exist' do
    it 'does not generate the CSV file' do
      Rake::Task['employees:generate_csv'].invoke(10)
      expect(File.exist?(output_path)).to be false
    end
  end
end
