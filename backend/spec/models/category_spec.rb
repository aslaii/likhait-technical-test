require 'rails_helper'

RSpec.describe Category, type: :model do
  describe "validations" do
    describe "presence" do
      it "validates presence of name" do
        category = Category.new(name: nil)
        expect(category).not_to be_valid
        expect(category.errors[:name]).to include("can't be blank")
      end

      it "is valid with a name" do
        category = Category.new(name: "Food")
        expect(category).to be_valid
      end
    end

    describe "uniqueness" do
      it "validates uniqueness of name (case-insensitive)" do
        Category.create!(name: "Food")
        category = Category.new(name: "food")
        expect(category).not_to be_valid
        expect(category.errors[:name]).to include("has already been taken")
      end

      it "allows different names" do
        Category.create!(name: "Food")
        category = Category.new(name: "Transport")
        expect(category).to be_valid
      end
    end

    describe "length" do
      it "validates maximum length of 100 characters" do
        category = Category.new(name: "a" * 101)
        expect(category).not_to be_valid
        expect(category.errors[:name]).to include("is too long (maximum is 100 characters)")
      end

      it "allows names up to 100 characters" do
        category = Category.new(name: "a" * 100)
        expect(category).to be_valid
      end
    end

    describe "whitespace stripping" do
      it "strips leading and trailing whitespace" do
        category = Category.create!(name: "  Food  ")
        expect(category.name).to eq("Food")
      end

      it "rejects whitespace-only names after stripping" do
        category = Category.new(name: "   ")
        expect(category).not_to be_valid
      end
    end
  end
end
