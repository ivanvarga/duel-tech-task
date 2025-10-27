import { Request, ResponseToolkit } from '@hapi/hapi';
import { AppContext } from '../../AppContext';

export class ProgramsController {
  constructor(private context: AppContext) {}

  async list(request: Request) {
    const { page = 1, limit = 20, sort = 'name', order = 'ASC', brand_id, company_id } = request.query as any;

    const skip = (page - 1) * limit;
    const filter: any = {};
    if (brand_id) filter.brand_id = brand_id;
    if (company_id) filter.company_id = company_id;

    const result = await this.context.services.program.findAll(
      filter,
      { skip, limit: Number(limit) },
      { field: sort, order: order }
    );

    return result;
  }

  async getById(request: Request, h: ResponseToolkit) {
    try {
      const program = await this.context.services.program.findById(request.params.id);
      return { data: program };
    } catch (error) {
      return h.response({ error: 'Program not found' }).code(404);
    }
  }

  async create(request: Request, h: ResponseToolkit) {
    const program = await this.context.services.program.create(request.payload as any);
    return h.response({ data: program }).code(201);
  }

  async update(request: Request, h: ResponseToolkit) {
    try {
      const program = await this.context.services.program.update(request.params.id, request.payload as any);
      return { data: program };
    } catch (error) {
      return h.response({ error: 'Program not found' }).code(404);
    }
  }

  async delete(request: Request, h: ResponseToolkit) {
    try {
      const program = await this.context.services.program.delete(request.params.id);
      return { data: program };
    } catch (error) {
      return h.response({ error: 'Program not found' }).code(404);
    }
  }
}
