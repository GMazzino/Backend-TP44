import { Api } from './api_array.js';

export class ApiGraphql {
  constructor() {
    this.api = new Api();
  }

  getProducts = () => {
    return this.api.getProducts().content;
  };
  getProductById = (id) => {
    return this.api.getProductById(id.id).content;
  };
}
