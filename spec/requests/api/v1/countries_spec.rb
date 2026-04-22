require 'rails_helper'

RSpec.describe "Api::V1::Countries", type: :request do
  describe "GET /api/v1/countries" do
    before do
      create(:country, name: "India", code: "IN")
      create(:country, name: "United States", code: "US")
      create(:country, name: "Germany", code: "DE")
    end

    it "returns all countries sorted by name" do
      get api_v1_countries_path
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      countries = json["countries"]
      expect(countries.map { |c| c["name"] }).to eq(["Germany", "India", "United States"])
    end

    it "returns country attributes" do
      get api_v1_countries_path
      json = JSON.parse(response.body)
      country = json["countries"].find { |c| c["name"] == "India" }
      expect(country["name"]).to eq("India")
      expect(country["code"]).to eq("IN")
      expect(country["id"]).to be_present
    end
  end

  describe "GET /api/v1/countries/:id" do
    let!(:country) { create(:country, name: "India", code: "IN") }

    it "returns the country" do
      get api_v1_country_path(country)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["country"]["name"]).to eq("India")
      expect(json["country"]["code"]).to eq("IN")
    end

    it "returns not found for invalid id" do
      get api_v1_country_path(id: 99999)
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "POST /api/v1/countries" do
    it "creates a country with valid params" do
      params = { country: { name: "Japan", code: "JP" } }
      expect {
        post api_v1_countries_path, params: params, as: :json
      }.to change(Country, :count).by(1)
      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json["country"]["name"]).to eq("Japan")
      expect(json["country"]["code"]).to eq("JP")
    end

    it "returns errors for invalid params" do
      params = { country: { name: "", code: "" } }
      post api_v1_countries_path, params: params, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["errors"]).to be_present
    end
  end

  describe "PATCH /api/v1/countries/:id" do
    let!(:country) { create(:country, name: "India", code: "IN") }
    it "updates the country with valid params" do
      params = { country: { name: "Republic of India" } }
      patch api_v1_country_path(country), params: params, as: :json
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["country"]["name"]).to eq("Republic of India")
      expect(json["country"]["code"]).to eq("IN")
    end

    it "returns errors for invalid params" do
      params = { country: { name: "" } }
      patch api_v1_country_path(country), params: params, as: :json
      expect(response).to have_http_status(:unprocessable_entity)
    end
  end

  describe "DELETE /api/v1/countries/:id" do
    let!(:country) { create(:country, name: "India", code: "IN") }
    it "deletes the country" do
      expect {
        delete api_v1_country_path(country), as: :json
      }.to change(Country, :count).by(-1)
      expect(response).to have_http_status(:ok)
    end
  end

  describe "POST /api/v1/countries/bulk_import" do
    def upload_csv(content)
      tempfile = Tempfile.new(["countries", ".csv"])
      tempfile.write(content)
      tempfile.rewind
      Rack::Test::UploadedFile.new(tempfile.path, "text/csv", false, original_filename: "countries.csv")
    end

    it "imports countries from a CSV file" do
      file = upload_csv("name,code\nIndia,IN\nJapan,JP\n")
      expect {
        post bulk_import_api_v1_countries_path, params: { file: file }
      }.to change(Country, :count).by(2)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["message"]).to eq("Import completed")
      expect(json["imported"]).to eq(2)
      expect(json["updated"]).to eq(0)
      expect(json["skipped"]).to eq(0)
    end

    it "updates existing countries with changed codes" do
      create(:country, name: "India", code: "OLD")
      file = upload_csv("name,code\nIndia,IN\n")
      expect {
        post bulk_import_api_v1_countries_path, params: { file: file }
      }.not_to change(Country, :count)
      expect(response).to have_http_status(:ok)
      json = JSON.parse(response.body)
      expect(json["imported"]).to eq(0)
      expect(json["updated"]).to eq(1)
      expect(Country.find_by(name: "India").code).to eq("IN")
    end

    it "returns error when no file is provided" do
      post bulk_import_api_v1_countries_path
      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["message"]).to eq("Import failed")
      expect(json["errors"]).to be_present
    end

    it "rejects files with invalid extensions" do
      tempfile = Tempfile.new(["countries", ".txt"])
      tempfile.write("name,code\nIndia,IN\n")
      tempfile.rewind
      file = Rack::Test::UploadedFile.new(tempfile.path, "text/plain", false, original_filename: "countries.txt")
      post bulk_import_api_v1_countries_path, params: { file: file }
      expect(response).to have_http_status(:unprocessable_entity)
      json = JSON.parse(response.body)
      expect(json["message"]).to eq("Import failed")
      expect(json["errors"]).to include(match(/Invalid file format/))
    end
  end
end
