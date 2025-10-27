import { Request, ResponseToolkit } from '@hapi/hapi';
import Boom from '@hapi/boom';
import { AppContext } from '../../AppContext';

export class UsersController {
  constructor(private context: AppContext) {}

  async list(request: Request, h: ResponseToolkit) {
    const query = request.query as any;

    const range = query.range ? JSON.parse(query.range) : [0, 24];
    const sort = query.sort ? JSON.parse(query.sort) : ['createdAt', 'DESC'];
    const filter = query.filter ? JSON.parse(query.filter) : {};

    const [start, end] = range;
    const limit = end - start + 1;
    const skip = start;
    const [sortField, sortOrder] = sort;

    const result = await this.context.services.user.findAll(
      filter,
      { skip, limit },
      { field: sortField, order: sortOrder }
    );

    const response = h.response(result);
    response.header('Content-Range', `users ${start}-${end}/${result.total}`);
    response.header('Access-Control-Expose-Headers', 'Content-Range');

    return response;
  }

  async getById(request: Request) {
    const { id } = request.params;

    try {
      const user = await this.context.services.user.findById(id);
      return { data: user };
    } catch (error) {
      throw Boom.notFound('User not found');
    }
  }

  async update(request: Request) {
    const { id } = request.params;
    const updates = request.payload as any;

    try {
      const user = await this.context.services.user.update(id, updates);
      return { data: user };
    } catch (error) {
      throw Boom.notFound('User not found');
    }
  }

  async delete(request: Request) {
    const { id } = request.params;

    try {
      const user = await this.context.services.user.delete(id);
      return { data: user };
    } catch (error) {
      throw Boom.notFound('User not found');
    }
  }
}
