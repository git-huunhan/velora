import { HealthController } from './health.controller';

describe('HealthController', () => {
  it('reports that the API is available', () => {
    const response = new HealthController().check();

    expect(response.status).toBe('ok');
    expect(Number.isNaN(Date.parse(response.timestamp))).toBe(false);
  });
});
