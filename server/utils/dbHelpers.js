const { dbType, Sequelize } = require('../config/database');

const isMySQL = dbType === 'mysql';
const Op = Sequelize?.Op;

const normalizeWhere = (where = {}) => {
  const normalized = {};

  Object.entries(where).forEach(([key, value]) => {
    const targetKey = key === '_id' ? 'id' : key;

    if (isMySQL && value && typeof value === 'object' && !Array.isArray(value)) {
      const translated = {};
      Object.entries(value).forEach(([opKey, opVal]) => {
        if (opKey === '$ne' && Op) {
          translated[Op.ne] = opVal;
        } else {
          translated[opKey] = opVal;
        }
      });
      normalized[targetKey] = translated;
    } else {
      normalized[targetKey] = value;
    }
  });

  return normalized;
};

const parseSort = (sort) => {
  if (!sort) return undefined;

  // Mongoose style "-createdAt" string
  if (typeof sort === 'string') {
    const field = sort.replace('-', '');
    const direction = sort.startsWith('-') ? 'DESC' : 'ASC';
    return [[field, direction]];
  }

  // Mongoose style object { createdAt: -1 }
  if (typeof sort === 'object') {
    return Object.entries(sort).map(([key, value]) => [
      key,
      value === -1 || value === 'desc' ? 'DESC' : 'ASC'
    ]);
  }

  return undefined;
};

const attachMySQLHelpers = (model) => {
  const baseFindAll = model.findAll.bind(model);
  const baseFindOne = model.findOne.bind(model);
  const baseFindByPk = model.findByPk.bind(model);
  const baseUpdate = model.update.bind(model);
  const baseCount = model.count.bind(model);

  Object.defineProperty(model.prototype, '_id', {
    get() {
      return this.getDataValue('id');
    }
  });

  const originalToJSON = model.prototype.toJSON;
  model.prototype.toJSON = function() {
    const values = originalToJSON ? originalToJSON.call(this) : { ...this.get() };
    values._id = values.id;
    return values;
  };

  model.prototype.deleteOne = function() {
    return this.destroy();
  };

  model.find = (where = {}) => {
    const normalizedWhere = normalizeWhere(where);
    let order;
    let limit;

    const execute = () =>
      baseFindAll({
        where: normalizedWhere,
        order,
        limit
      });

    const chain = {
      sort(sortArg) {
        order = parseSort(sortArg);
        return chain;
      },
      limit(value) {
        limit = value;
        return chain;
      },
      then(onFulfilled, onRejected) {
        return execute().then(onFulfilled, onRejected);
      },
      catch(onRejected) {
        return execute().catch(onRejected);
      }
    };

    return chain;
  };

  model.findOne = (query = {}) => {
    const isOptionsObject = typeof query === 'object' && (
      query.where ||
      query.attributes ||
      query.order ||
      query.include ||
      query.paranoid !== undefined ||
      query.transaction
    );

    const options = isOptionsObject
      ? { ...query, where: normalizeWhere(query.where || {}) }
      : { where: normalizeWhere(query) };

    return baseFindOne(options);
  };
  model.findById = (id) => baseFindByPk(id);
  model.findByIdAndUpdate = async (id, values, options = {}) => {
    const [count] = await baseUpdate(values, { where: { id } });
    if (!count) return null;
    const updated = await baseFindByPk(id);
    if (options.new === false) return updated;
    return updated;
  };
  model.findByIdAndDelete = async (id) => {
    const instance = await baseFindByPk(id);
    if (!instance) return null;
    await instance.destroy();
    return instance;
  };
  model.findOneAndUpdate = async (where, values, options = {}) => {
    const normalizedWhere = normalizeWhere(where);
    let instance = await baseFindOne({ where: normalizedWhere });
    if (!instance && options.upsert) {
      instance = await model.create({ ...normalizedWhere, ...values });
      return instance;
    }
    if (!instance) return null;
    await instance.update(values);
    return instance;
  };
  model.countDocuments = (where = {}) => baseCount({ where: normalizeWhere(where) });
};

module.exports = {
  isMySQL,
  normalizeWhere,
  parseSort,
  attachMySQLHelpers
};
