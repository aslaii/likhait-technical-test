require 'rails_helper'

RSpec.describe Expense, type: :model do
  describe "date validation" do
    let(:category) { Category.create!(name: "Model Test Category") }

    def build_expense(date:)
      described_class.new(
        description: "Test expense",
        amount: 25.00,
        category: category,
        date: date
      )
    end

    it "allows today's date" do
      expect(build_expense(date: Date.current)).to be_valid
    end

    it "allows yesterday's date" do
      expect(build_expense(date: Date.current - 1.day)).to be_valid
    end

    it "allows tomorrow's date for timezone tolerance" do
      expect(build_expense(date: Date.current + 1.day)).to be_valid
    end

    it "rejects a date two days in the future" do
      expense = build_expense(date: Date.current + 2.days)

      expect(expense).not_to be_valid
      expect(expense.errors[:date]).to be_present
    end

    it "rejects a date one year in the future" do
      expense = build_expense(date: Date.current + 1.year)

      expect(expense).not_to be_valid
      expect(expense.errors[:date]).to be_present
    end
  end
end
