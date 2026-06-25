import { PrismaService } from './index.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(() => {
    service = new PrismaService();
  });

  it('deve ser definido', () => {
    expect(service).toBeDefined();
  });

  it('deve implementar onModuleInit', () => {
    expect(typeof service.onModuleInit).toBe('function');
  });
});
