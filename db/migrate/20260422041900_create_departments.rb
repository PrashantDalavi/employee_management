class CreateDepartments < ActiveRecord::Migration[7.1]
  def change
    create_table :departments do |t|
      t.string :name, null: false
      t.string :code, null: false
      t.references :country, null: false, foreign_key: true
      t.text :description
      t.boolean :active, default: true

      t.timestamps
    end

    add_index :departments, [:name, :country_id], unique: true
  end
end
