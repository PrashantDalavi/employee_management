require 'rails_helper'

RSpec.describe "Api::V1::Departments", type: :request do
  let!(:country) { create(:country, name: "India", code: "IN") }

  describe "GET /api/v1/departments" do
    before do
      create(:department, name: "Engineering", code: "ENG", country: country)
      create(:department, name: "Marketing", code: "MKT", country: country)
      create(:department, name: "Sales", code: "SAL", country: country)
    end

    it "returns all departments sorted by name" do
      get api_v1_departments_path
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      departments = json["departments"]
      expect(departments.map { |d| d["name"] }).to eq(["Engineering", "Marketing", "Sales"])
    end

    it "includes country data in response" do
      get api_v1_departments_path
      json = JSON.parse(response.body)
      department = json["departments"].first
      expect(department["country"]["name"]).to eq("India")
      expect(department["country"]["code"]).to eq("IN")
    end
  end

  describe "GET /api/v1/departments/:id" do
    let!(:department) { create(:department, name: "Engineering", code: "ENG", country: country) }

    it "returns the department" do
      get api_v1_department_path(department)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["department"]["name"]).to eq("Engineering")
      expect(json["department"]["country"]["name"]).to eq("India")
    end

    it "returns not found for invalid id" do
      get api_v1_department_path(id: 99999)
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/v1/departments" do
    it "creates a department with valid params" do
      params = { department: { name: "Finance", code: "FIN", country_id: country.id } }
      expect {
        post api_v1_departments_path, params: params, as: :json
      }.to change(Department, :count).by(1)
      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json["department"]["name"]).to eq("Finance")
    end

    it "returns errors for invalid params" do
      params = { department: { name: "", code: "" } }
      post api_v1_departments_path, params: params, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["errors"]).to be_present
    end
  end

  describe "PATCH /api/v1/departments/:id" do
    let!(:department) { create(:department, name: "Engineering", code: "ENG", country: country) }

    it "updates the department with valid params" do
      params = { department: { name: "Software Engineering" } }
      patch api_v1_department_path(department), params: params, as: :json
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["department"]["name"]).to eq("Software Engineering")
    end

    it "returns errors for invalid params" do
      params = { department: { name: "" } }
      patch api_v1_department_path(department), params: params, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "DELETE /api/v1/departments/:id" do
    let!(:department) { create(:department, name: "Engineering", code: "ENG", country: country) }

    it "deletes the department" do
      expect {
        delete api_v1_department_path(department), as: :json
      }.to change(Department, :count).by(-1)
      expect(response).to have_http_status(:ok)
    end
  end

  describe "POST /api/v1/departments/bulk_import" do
    before do
      create(:country, name: "Germany", code: "DE")
    end

    def upload_csv(content)
      tempfile = Tempfile.new(["departments", ".csv"])
      tempfile.write(content)
      tempfile.rewind
      Rack::Test::UploadedFile.new(tempfile.path, "text/csv", false, original_filename: "departments.csv")
    end

    it "imports departments from a CSV file" do
      file = upload_csv("name,code,country_code\nEngineering,ENG,IN\nMarketing,MKT,DE\n")
      expect {
        post bulk_import_api_v1_departments_path, params: { file: file }
      }.to change(Department, :count).by(2)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["message"]).to eq("Import completed")
      expect(json["imported"]).to eq(2)
      expect(json["updated"]).to eq(0)
      expect(json["skipped"]).to eq(0)
    end

    it "updates existing departments with changed codes" do
      create(:department, name: "Engineering", code: "OLD", country: country)
      file = upload_csv("name,code,country_code\nEngineering,ENG,IN\n")
      expect {
        post bulk_import_api_v1_departments_path, params: { file: file }
      }.not_to change(Department, :count)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["updated"]).to eq(1)
      expect(Department.find_by(name: "Engineering", country: country).code).to eq("ENG")
    end

    it "reports error for invalid country code" do
      file = upload_csv("name,code,country_code\nEngineering,ENG,XX\n")
      post bulk_import_api_v1_departments_path, params: { file: file }
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["errors"]).to include(match(/Country with code 'XX' not found/))
    end

    it "returns error when no file is provided" do
      post bulk_import_api_v1_departments_path
      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["message"]).to eq("Import failed")
    end

    it "rejects files with invalid extensions" do
      tempfile = Tempfile.new(["departments", ".txt"])
      tempfile.write("name,code,country_code\nEngineering,ENG,IN\n")
      tempfile.rewind
      file = Rack::Test::UploadedFile.new(tempfile.path, "text/plain", false, original_filename: "departments.txt")
      post bulk_import_api_v1_departments_path, params: { file: file }
      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["message"]).to eq("Import failed")
      expect(json["errors"]).to include(match(/Invalid file format/))
    end
  end
end
