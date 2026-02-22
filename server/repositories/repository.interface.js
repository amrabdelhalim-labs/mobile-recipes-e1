/**
 * @typedef {Object} QueryOptions
 * @property {Object} [include] - Eager loading relations
 * @property {Object} [where] - Filter conditions
 * @property {number} [limit] - Max number of results
 * @property {number} [offset] - Number of results to skip
 * @property {Array<[string, string]>} [order] - Sort order: [['field', 'ASC|DESC']]
 * @property {boolean} [raw] - Return plain objects instead of model instances
 * @property {boolean} [paranoid] - Include/exclude soft-deleted records
 */

/**
 * Generic Repository Interface
 * All concrete repositories must implement these methods
 * 
 * @interface IRepository
 */
export const IRepository = {
  /**
   * Find all records matching criteria
   * @param {QueryOptions} options
   * @returns {Promise<Array>}
   */
  findAll: async (options = {}) => undefined,

  /**
   * Find single record by criteria
   * @param {QueryOptions} options
   * @returns {Promise<Object|null>}
   */
  findOne: async (options = {}) => undefined,

  /**
   * Find record by primary key
   * @param {*} id
   * @param {QueryOptions} options
   * @returns {Promise<Object|null>}
   */
  findByPk: async (id, options = {}) => undefined,

  /**
   * Find all with pagination
   * @param {number} page - Page number (1-indexed)
   * @param {number} limit - Items per page
   * @param {QueryOptions} options
   * @returns {Promise<{rows: Array, count: number, page: number, totalPages: number}>}
   */
  findPaginated: async (page = 1, limit = 10, options = {}) => undefined,

  /**
   * Create new record
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  create: async (data) => undefined,

  /**
   * Update record by primary key
   * @param {*} id
   * @param {Object} data
   * @returns {Promise<[number, Array]>} [affectedCount, updatedRecords]
   */
  update: async (id, data) => undefined,

  /**
   * Update all records matching criteria
   * @param {Object} data
   * @param {Object} where - Filter conditions
   * @returns {Promise<number>} Number of affected records
   */
  updateWhere: async (data, where = {}) => undefined,

  /**
   * Delete record by primary key
   * @param {*} id
   * @returns {Promise<number>} Number of deleted records
   */
  delete: async (id) => undefined,

  /**
   * Delete all records matching criteria
   * @param {Object} where - Filter conditions
   * @returns {Promise<number>} Number of deleted records
   */
  deleteWhere: async (where = {}) => undefined,

  /**
   * Check if record exists by primary key
   * @param {*} id
   * @returns {Promise<boolean>}
   */
  exists: async (id) => undefined,

  /**
   * Count records matching criteria
   * @param {QueryOptions} options
   * @returns {Promise<number>}
   */
  count: async (options = {}) => undefined,

  /**
   * Get model instance directly (for raw Sequelize operations)
   * @returns {Object} Sequelize Model
   */
  getModel: () => undefined,
};

export default IRepository;
