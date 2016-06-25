import * as events from './events';

describe('event functions', () => {
  let config;
  
  beforeEach(() => {
    config = {
      emit: () => {},
      enableStackTrace: false,
      message: '',
      on: () => {},
      remote: {},
    };
  });

  describe('createErrorEvent function', () => {
    it('should run create a serializable error', () => {
      const event = events.createError(config, 'invoke', new Error('test'));

      expect(typeof JSON.stringify(event)).toBe('string');
    });
  });

});