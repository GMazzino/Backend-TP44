import file from 'fs/promises';
import logger from '../utils/logger.js';

export class Contenedor {
  static prodId = 1000;
  static fname;

  constructor(fname) {
    this.fname = fname;
  }

  async save(data) {
    data.id = Contenedor.prodId++;
    try {
      await file.appendFile(this.fname, JSON.stringify(data, null, 2), 'utf-8');
      return data.id;
    } catch (err) {
      logger.error(err);
      return err;
    }
  }
}
