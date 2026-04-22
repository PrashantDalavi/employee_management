FactoryBot.define do
  factory :employee do
    first_name { "John" }
    last_name { "Doe" }
    sequence(:email) { |n| "employee#{n}@company.com" }
    sequence(:employee_code) { |n| "EMP#{n.to_s.rjust(3, '0')}" }
    job_title { "Software Engineer" }
    hire_date { Date.today }
    salary { 75000.00 }
    currency { "USD" }
    active { true }
    department
    country
  end
end
