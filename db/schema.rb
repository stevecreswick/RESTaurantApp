# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema.define(version: 20150828151645) do

  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "fooditems", force: :cascade do |t|
    t.string  "name"
    t.string  "course"
    t.string  "protein"
    t.integer "spice_level"
    t.decimal "price"
    t.text    "description"
  end

  create_table "itemorders", force: :cascade do |t|
    t.integer  "fooditem_id"
    t.integer  "party_id"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.boolean  "is_active"
  end

  create_table "parties", force: :cascade do |t|
    t.integer  "itemorder_id"
    t.integer  "table_id"
    t.string   "table_location"
    t.integer  "number_of_guests"
    t.decimal  "bill"
    t.boolean  "paid_bill"
    t.datetime "created_at"
    t.datetime "updated_at"
    t.boolean  "is_active"
  end

  create_table "restaurant_tables", force: :cascade do |t|
    t.integer  "party_id"
    t.integer  "server_id"
    t.string   "table_location"
    t.boolean  "is_occupied"
    t.datetime "created_at"
    t.datetime "updated_at"
  end

end
