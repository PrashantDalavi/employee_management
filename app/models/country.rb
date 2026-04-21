class Country < ApplicationRecord
  validates :name, presence: true
  validates :code, presence: true
  validates :name, uniqueness: { scope: :code }
end
