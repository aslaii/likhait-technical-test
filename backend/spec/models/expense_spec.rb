require 'rails_helper'

RSpec.describe Expense, type: :model do
  let(:category) { Category.create!(name: "Model Test Category") }

  def build_expense(attributes = {})
    described_class.new(
      {
        description: "Test expense",
        amount: 25.00,
        category: category,
        date: Date.current
      }.merge(attributes)
    )
  end

  it "is valid with valid attributes" do
    expect(build_expense).to be_valid
  end

  it "requires a positive amount" do
    expect(build_expense(amount: 0)).not_to be_valid
    expect(build_expense(amount: -1)).not_to be_valid
  end

  it "requires a description" do
    expense = build_expense(description: "")

    expect(expense).not_to be_valid
    expect(expense.errors[:description]).to be_present
  end

  it "allows tomorrow's date for timezone tolerance" do
    expect(build_expense(date: Date.current + 1.day)).to be_valid
  end

  it "rejects dates beyond timezone tolerance" do
    expense = build_expense(date: Date.current + 2.days)

    expect(expense).not_to be_valid
    expect(expense.errors[:date]).to be_present
  end
end
