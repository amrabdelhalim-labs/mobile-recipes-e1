/**
 * Base Repository Class
 * Implements generic database operations using Sequelize ORM
 * 
 * Usage:
 *   const userRepo = new BaseRepository(User);
 *   const users = await userRepo.findAll({ limit: 10 });
 *   const user = await userRepo.findByPk(1);
 *   const newUser = await userRepo.create({ name, email });
 */
class BaseRepository {
  /**
   * @param {Object} model - Sequelize model instance
   */
  constructor(model) {
    if (!model) {
      throw new Error('Repository requires a Sequelize model');
    }
    this.model = model;
  }

  /**
   * Find all records matching criteria
   * @param {Object} options - Query options (include, where, limit, offset, order, raw)
   * @returns {Promise<Array>}
   */
  async findAll(options = {}) {
    try {
      return await this.model.findAll(options);
    } catch (error) {
      console.error(`Error in ${this.model.name}.findAll:`, error);
      throw error;
    }
  }

  /**
   * Find single record by criteria
   * @param {Object} options - Query options (where, include, raw)
   * @returns {Promise<Object|null>}
   */
  async findOne(options = {}) {
    try {
      return await this.model.findOne(options);
    } catch (error) {
      console.error(`Error in ${this.model.name}.findOne:`, error);
      throw error;
    }
  }

  /**
   * Find record by primary key
   * @param {*} id - Primary key value
   * @param {Object} options - Query options (include, raw)
   * @returns {Promise<Object|null>}
   */
  async findByPk(id, options = {}) {
    try {
      return await this.model.findByPk(id, options);
    } catch (error) {
      console.error(`Error in ${this.model.name}.findByPk:`, error);
      throw error;
    }
  }

  /**
   * Find all with pagination
   * @param {number} page - Page number (1-indexed)
   * @param {number} limit - Items per page
   * @param {Object} options - Additional query options (include, where, order, raw)
   * @returns {Promise<{rows: Array, count: number, page: number, totalPages: number}>}
   */
  async findPaginated(page = 1, limit = 10, options = {}) {
    try {
      const offset = (page - 1) * limit;
      const { count, rows } = await this.model.findAndCountAll({
        ...options,
        limit,
        offset,
        distinct: true,
      });

      const totalPages = Math.ceil(count / limit);

      return {
        rows,
        count,
        page,
        totalPages,
      };
    } catch (error) {
      console.error(`Error in ${this.model.name}.findPaginated:`, error);
      throw error;
    }
  }

  /**
   * Create new record
   * @param {Object} data - Record attributes
   * @returns {Promise<Object>}
   */
  async create(data) {
    try {
      return await this.model.create(data);
    } catch (error) {
      console.error(`Error creating ${this.model.name}:`, error);
      throw error;
    }
  }

  /**
   * Update record by primary key
   * @param {*} id - Primary key value
   * @param {Object} data - Attributes to update
   * @returns {Promise<number>} Number of affected records
   */
  async update(id, data) {
    try {
      const [affectedCount] = await this.model.update(data, {
        where: { id },
        individualHooks: true,
      });
      return affectedCount;
    } catch (error) {
      console.error(`Error updating ${this.model.name}:`, error);
      throw error;
    }
  }

  /**
   * Update all records matching criteria
   * @param {Object} data - Attributes to update
   * @param {Object} where - Filter conditions
   * @returns {Promise<number>} Number of affected records
   */
  async updateWhere(data, where = {}) {
    try {
      const [affectedCount] = await this.model.update(data, {
        where,
        individualHooks: true,
      });
      return affectedCount;
    } catch (error) {
      console.error(`Error updating ${this.model.name} with where:`, error);
      throw error;
    }
  }

  /**
   * Delete record by primary key
   * @param {*} id - Primary key value
   * @returns {Promise<number>} Number of deleted records
   */
  async delete(id) {
    try {
      return await this.model.destroy({
        where: { id },
        individualHooks: true,
      });
    } catch (error) {
      console.error(`Error deleting ${this.model.name}:`, error);
      throw error;
    }
  }

  /**
   * Delete all records matching criteria
   * @param {Object} where - Filter conditions
   * @returns {Promise<number>} Number of deleted records
   */
  async deleteWhere(where = {}) {
    try {
      return await this.model.destroy({
        where,
        individualHooks: true,
      });
    } catch (error) {
      console.error(`Error deleting ${this.model.name} with where:`, error);
      throw error;
    }
  }

  /**
   * Check if record exists by primary key
   * @param {*} id - Primary key value
   * @returns {Promise<boolean>}
   */
  async exists(id) {
    try {
      const record = await this.model.findByPk(id);
      return record !== null;
    } catch (error) {
      console.error(`Error checking existence of ${this.model.name}:`, error);
      throw error;
    }
  }

  /**
   * Count records matching criteria
   * @param {Object} options - Query options (where, scope)
   * @returns {Promise<number>}
   */
  async count(options = {}) {
    try {
      return await this.model.count(options);
    } catch (error) {
      console.error(`Error counting ${this.model.name}:`, error);
      throw error;
    }
  }

  /**
   * Get model instance directly for raw Sequelize operations
   * Use this sparingly when repository methods don't cover your use case
   * @returns {Object} Sequelize Model
   */
  getModel() {
    return this.model;
  }

  /**
   * Bulk create multiple records
   * @param {Array<Object>} data - Array of record attributes
   * @returns {Promise<Array>}
   */
  async bulkCreate(data) {
    try {
      return await this.model.bulkCreate(data);
    } catch (error) {
      console.error(`Error bulk creating ${this.model.name}:`, error);
      throw error;
    }
  }

  /**
   * Bulk delete multiple records
   * @param {Array<*>} ids - Array of primary key values
   * @returns {Promise<number>} Number of deleted records
   */
  async bulkDelete(ids) {
    try {
      return await this.model.destroy({
        where: { id: ids },
      });
    } catch (error) {
      console.error(`Error bulk deleting ${this.model.name}:`, error);
      throw error;
    }
  }
}

export default BaseRepository;
