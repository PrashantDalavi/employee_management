require 'rails_helper'

RSpec.describe Department, type: :model do
  describe 'validations' do
    subject { build(:department) }
    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:code) }
    it { should validate_uniqueness_of(:name).scoped_to(:country_id) }
  end

  describe 'associations' do
    it { should belong_to(:country) }
  end
end
