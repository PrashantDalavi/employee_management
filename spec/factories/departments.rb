FactoryBot.define do
  factory :department do
    sequence(:name) { |n| "Department #{n}" }
    sequence(:code) { |n| "D#{n}" }
    country
    description { nil }
    active { true }
  end
end
