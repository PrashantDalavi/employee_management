require "csv"

namespace :employees do
  desc "Generate a CSV file with dummy employee data. Usage: rake 'employees:generate_csv[10000]'"
  task :generate_csv, [:count] => :environment do |_t, args|
    count = (args[:count] || 10_000).to_i
    output_path = Rails.root.join("sample_files", "employees_bulk.csv")

    # Preload valid country → department mappings
    mappings = Department.includes(:country).map { |d| [d.country.code, d.code] }
    if mappings.empty?
      puts "No departments found. Import countries and departments first."
      next
    end

    first_names = %w[James Mary Robert Patricia John Jennifer Michael Linda David Elizabeth
                     William Barbara Richard Susan Joseph Jessica Thomas Sarah Charles Karen
                     Priya Rahul Aisha Vikram Neha Arjun Deepa Sanjay Kavita Raj
                     Hans Marie Klaus Anna Fritz Sophie Lukas Emma Oliver Amelia]

    last_names = %w[Smith Johnson Williams Brown Jones Garcia Miller Davis Rodriguez Martinez
                    Anderson Taylor Thomas Hernandez Moore Martin Jackson Thompson White Lopez
                    Patel Kumar Singh Shah Gupta Sharma Verma Mehta Reddy Nair
                    Weber Mueller Schmidt Fischer Schneider Wolf Wagner Bauer Koch Richter]

    job_titles = %w[Software\ Engineer Senior\ Software\ Engineer Staff\ Engineer
                    Product\ Manager UX\ Designer Data\ Scientist DevOps\ Engineer
                    QA\ Engineer Frontend\ Developer Backend\ Developer Technical\ Lead
                    Financial\ Analyst Marketing\ Manager Sales\ Representative HR\ Specialist]

    currencies = Hash.new("USD").merge("IN" => "INR", "DE" => "EUR", "GB" => "GBP")
    salary_ranges = Hash.new(50_000..150_000).merge(
      "US" => 60_000..200_000, "IN" => 500_000..3_000_000,
      "DE" => 40_000..150_000, "GB" => 35_000..130_000
    )

    date_range = (Date.new(2018, 1, 1)..Date.today).to_a
    used_emails = Set.new

    CSV.open(output_path, "wb") do |csv|
      csv << %w[first_name last_name email phone employee_code job_title salary currency hire_date country_code department_code active]

      count.times do |i|
        first = first_names.sample
        last = last_names.sample
        country_code, dept_code = mappings.sample

        # Unique email
        email = "#{first.downcase}.#{last.downcase}.#{i}@company.com"
        email = "#{first.downcase}.#{last.downcase}.#{i}.#{rand(9999)}@company.com" while used_emails.include?(email)
        used_emails << email

        csv << [
          first, last, email,
          "+#{rand(1..99)}-#{rand(100..999)}-#{rand(1_000_000..9_999_999)}",
          "EMP#{(i + 1).to_s.rjust(5, '0')}",
          job_titles.sample,
          rand(salary_ranges[country_code]),
          currencies[country_code],
          date_range.sample.to_s,
          country_code, dept_code,
          rand(100) < 95
        ]

        print "\r  Generating... #{i + 1}/#{count}" if (i + 1) % 1000 == 0
      end
    end

    file_size = (File.size(output_path).to_f / 1024 / 1024).round(2)
    puts "\r Generated #{count} employees (#{file_size} MB) → #{output_path}"
  end
end
