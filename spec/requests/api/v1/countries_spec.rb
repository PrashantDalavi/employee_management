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
end
