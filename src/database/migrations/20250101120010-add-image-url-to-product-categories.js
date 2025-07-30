'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    /*
      # Add image_url column to product_categories table

      1. Changes
        - Add `image_url` column to `product_categories` table
        - Column type: STRING, nullable
        - Will store S3 URLs for category images

      2. Notes
        - This allows each product category to have an associated image
        - Images will be stored in S3 and URLs saved in database
    */

    await queryInterface.addColumn('product_categories', 'image_url', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('product_categories', 'image_url');
  }
};