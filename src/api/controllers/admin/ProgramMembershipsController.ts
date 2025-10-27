import { Request, ResponseToolkit } from '@hapi/hapi';
import { AppContext } from '../../AppContext';

export class ProgramMembershipsController {
  constructor(private context: AppContext) {}

  async list(request: Request, h: ResponseToolkit) {
    const query = request.query as any;

    const range = query.range ? JSON.parse(query.range) : [0, 24];
    const sort = query.sort ? JSON.parse(query.sort) : ['joined_at', 'DESC'];
    const filter = query.filter ? JSON.parse(query.filter) : {};

    const [start, end] = range;
    const limit = end - start + 1;
    const skip = start;
    const [sortField, sortOrder] = sort;

    const result = await this.context.services.programMembership.findAll(
      filter,
      { skip, limit },
      { field: sortField, order: sortOrder }
    );

    const response = h.response(result);
    response.header('Content-Range', `program-memberships ${start}-${end}/${result.total}`);
    response.header('Access-Control-Expose-Headers', 'Content-Range');

    return response;
  }

  async getById(request: Request, h: ResponseToolkit) {
    try {
      const membership = await this.context.services.programMembership.findById(request.params.id);
      return { data: membership };
    } catch (error) {
      return h.response({ error: 'Program membership not found' }).code(404);
    }
  }

  async update(request: Request, h: ResponseToolkit) {
    try {
      const membership = await this.context.services.programMembership.update(request.params.id, request.payload as any);
      return { data: membership };
    } catch (error) {
      return h.response({ error: 'Program membership not found' }).code(404);
    }
  }

  async delete(request: Request, h: ResponseToolkit) {
    try {
      const membership = await this.context.services.programMembership.delete(request.params.id);
      return { data: membership };
    } catch (error) {
      return h.response({ error: 'Program membership not found' }).code(404);
    }
  }
}
