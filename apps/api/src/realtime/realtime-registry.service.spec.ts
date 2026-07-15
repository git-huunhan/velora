import { RealtimeRegistryService } from './realtime-registry.service';

describe('RealtimeRegistryService', () => {
  let registry: RealtimeRegistryService;

  beforeEach(() => {
    registry = new RealtimeRegistryService();
  });

  it('tracks user sockets and project subscriptions', () => {
    registry.addConnection('socket-1', 'user-1');
    registry.subscribeProject('socket-1', 'project-1');

    expect(registry.getConnection('socket-1')?.userId).toBe('user-1');
    expect(registry.getUserSocketIds('user-1')).toEqual(['socket-1']);
    expect(registry.getProjectSocketIds('project-1')).toEqual(['socket-1']);
  });

  it('cleans user and project indexes when a socket disconnects', () => {
    registry.addConnection('socket-1', 'user-1');
    registry.subscribeProject('socket-1', 'project-1');
    registry.subscribeProject('socket-1', 'project-2');

    registry.removeConnection('socket-1');

    expect(registry.getConnection('socket-1')).toBeUndefined();
    expect(registry.getUserSocketIds('user-1')).toEqual([]);
    expect(registry.getProjectSocketIds('project-1')).toEqual([]);
    expect(registry.getProjectSocketIds('project-2')).toEqual([]);
  });

  it('moves an existing socket id to the latest user connection', () => {
    registry.addConnection('socket-1', 'user-1');
    registry.subscribeProject('socket-1', 'project-1');

    registry.addConnection('socket-1', 'user-2');

    expect(registry.getUserSocketIds('user-1')).toEqual([]);
    expect(registry.getProjectSocketIds('project-1')).toEqual([]);
    expect(registry.getUserSocketIds('user-2')).toEqual(['socket-1']);
  });

  it('removes all sockets for a user from a project subscription', () => {
    registry.addConnection('socket-1', 'user-1');
    registry.addConnection('socket-2', 'user-1');
    registry.addConnection('socket-3', 'user-2');
    registry.subscribeProject('socket-1', 'project-1');
    registry.subscribeProject('socket-2', 'project-1');
    registry.subscribeProject('socket-2', 'project-2');
    registry.subscribeProject('socket-3', 'project-1');

    expect(registry.unsubscribeUserFromProject('user-1', 'project-1')).toEqual([
      'socket-1',
      'socket-2',
    ]);

    expect(registry.getProjectSocketIds('project-1')).toEqual(['socket-3']);
    expect(registry.getProjectSocketIds('project-2')).toEqual(['socket-2']);
    expect(registry.getUserSocketIds('user-1')).toEqual([
      'socket-1',
      'socket-2',
    ]);
  });
});
