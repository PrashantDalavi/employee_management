require 'rails_helper'

RSpec.describe Countries::ImportService do
  let(:csv_content) { "name,code\nIndia,IN\nGermany,DE\nJapan,JP\n" }
  let(:file) { create_uploaded_file(csv_content, "countries.csv", "text/csv") }

  def create_uploaded_file(content, filename, content_type)
    tempfile = Tempfile.new([filename, File.extname(filename)])
    tempfile.write(content)
    tempfile.rewind
    ActionDispatch::Http::UploadedFile.new(
      tempfile: tempfile,
      filename: filename,
      type: content_type
    )
  end

  describe "#call" do
    it "imports countries from a valid CSV file" do
      result = described_class.new(file).call
      expect(result[:success]).to be true
      expect(result[:imported]).to eq(3)
      expect(result[:skipped]).to eq(0)
      expect(Country.count).to eq(3)
      expect(Country.pluck(:name)).to match_array(["India", "Germany", "Japan"])
    end

    it "skips duplicate countries on re-import" do
      create(:country, name: "India", code: "IN")
      result = described_class.new(file).call
      expect(result[:success]).to be true
      expect(result[:imported]).to eq(2)
      expect(result[:skipped]).to eq(1)
      expect(Country.count).to eq(3)
    end

    it "updates country code when name matches but code differs" do
      create(:country, name: "India", code: "OLD")
      result = described_class.new(file).call
      expect(result[:success]).to be true
      expect(result[:updated]).to eq(1)
      expect(result[:imported]).to eq(2)
      expect(Country.find_by(name: "India").code).to eq("IN")
    end

    it "returns errors for missing file" do
      result = described_class.new(nil).call
      expect(result[:success]).to be false
      expect(result[:errors]).to include("No file provided")
    end

    it "returns errors for invalid file format" do
      bad_file = create_uploaded_file("data", "countries.txt", "text/plain")
      result = described_class.new(bad_file).call
      expect(result[:success]).to be false
      expect(result[:errors]).to include(match(/Invalid file format/))
    end

    it "returns errors for missing required headers" do
      bad_csv = "country_name,country_code\nIndia,IN\n"
      bad_file = create_uploaded_file(bad_csv, "countries.csv", "text/csv")
      result = described_class.new(bad_file).call
      expect(result[:success]).to be false
      expect(result[:errors]).to include(match(/Missing required columns/))
    end

    it "skips blank rows" do
      csv_with_blanks = "name,code\nIndia,IN\n,,\nJapan,JP\n"
      file_with_blanks = create_uploaded_file(csv_with_blanks, "countries.csv", "text/csv")
      result = described_class.new(file_with_blanks).call
      expect(result[:success]).to be true
      expect(result[:imported]).to eq(2)
    end

    it "reports row-level validation errors with country details" do
      csv_with_invalid = "name,code\n,IN\nJapan,JP\n"
      file_with_invalid = create_uploaded_file(csv_with_invalid, "countries.csv", "text/csv")
      result = described_class.new(file_with_invalid).call
      expect(result[:success]).to be true
      expect(result[:imported]).to eq(1)
      expect(result[:errors].first).to match(/Row 2/)
      expect(result[:errors].first).to match(/IN/)
    end
  end
end
