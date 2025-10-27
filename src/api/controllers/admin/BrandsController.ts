import { Request, ResponseToolkit } from '@hapi/hapi';
import Boom from '@hapi/boom';
import { AppContext } from '../../AppContext';

export class BrandsController {
  constructor(private context: AppContext) {}

  async list(request: Request, h: ResponseToolkit) {
    const query = request.query as any;

    const range = query.range ? JSON.parse(query.range) : [0, 24];
    const sort = query.sort ? JSON.parse(query.sort) : ['name', 'ASC'];
    const filter = query.filter ? JSON.parse(query.filter) : {};

    const [start, end] = range;
    const limit = end - start + 1;
    const skip = start;
    const [sortField, sortOrder] = sort;

    const result = await this.context.services.brand.findAll(
      filter,
      { skip, limit },
      { field: sortField, order: sortOrder }
    );

    const response = h.response(result);
    response.header('Content-Range', `brands ${start}-${end}/${result.total}`);
    response.header('Access-Control-Expose-Headers', 'Content-Range');

    return response;
  }

  async getById(request: Request) {
    const { id } = request.params;

    try {
      const brand = await this.context.services.brand.findById(id);
      return { data: brand };
    } catch (error) {
      throw Boom.notFound('Brand not found');
    }
  }

  async update(request: Request) {
    const { id } = request.params;
    const updates = request.payload as any;

    try {
      const brand = await this.context.services.brand.update(id, updates);
      return { data: brand };
    } catch (error) {
      throw Boom.notFound('Brand not found');
    }
  }

  async delete(request: Request) {
    const { id } = request.params;

    try {
      const brand = await this.context.services.brand.delete(id);
      return { data: brand };
    } catch (error) {
      throw Boom.notFound('Brand not found');
    }
  }
}
