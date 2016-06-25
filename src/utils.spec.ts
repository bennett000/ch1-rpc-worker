import * as utils from './utils';

describe('utils functions', () => {

  describe('createEvent', () => {
    it('should default to generating a unique id', () => {
    });
  });

  describe('isFunction', () => {
    it('should type check for a function', () => {
      expect(utils.isFunction(() => {})).toBe(true);
      expect(utils.isFunction(5)).toBe(false);
    });
  });
  
  describe('isObject function', () => {
    it('should return false if given a falsey value', () => {
      expect(utils.isObject(null)).toBe(false);
    });

    it('should return false if a given value is not an object', () => {
      expect(utils.isObject(57)).toBe(false);
      expect(utils.isObject('hello')).toBe(false);
    });
    
    it('should return true if given an object created from null', () => {
      expect(utils.isObject(Object.create(null))).toBe(true);
    });
    
    it('should return true if given a "normal" object', () => {
      expect(utils.isObject({})).toBe(true);
    });
  });
  
  describe('noop function', () => {
    it('there should be a noop function', () => {
      expect(() => utils.noop()).not.toThrow();
    });
  });

  describe('throwIfNotFunction function', () => {
    it('should throw if given a non function', () => {
      expect(() => utils.throwIfNotFunction({})).toThrowError();
    });
    
    it('should optionally forward custom messages', () => {
      expect(() => utils.throwIfNotFunction({}, 'test'))
        .toThrowError(/.*test.*/);
    });
    
    it('should *not* throw if given a function', () => {
      expect(() => utils.throwIfNotFunction(utils.noop)).not.toThrowError();
    });
  });
  
  describe('typeError', () => {
    it('should throw a TypeError', () => {
      expect(() => utils.typeError('message')).toThrowError(/.*message.*/);
    });
  });
  
  describe('uid singleton', () => {
    it('there should be a uid singleton function that gives ids', () => {
      const id1 = utils.uid();
      const id2 = utils.uid();
      
      expect(id1 && id2).toBeTruthy();
      expect(id1).not.toBe(id2);
    });

    it('should generate ids that have a hex timestamp as their first parameter',
      () => {
        const threshold = 5;
        const now = Date.now();
        const idParts = utils.uid().split('-');
        const date = parseInt(idParts[1], 16);
        const minDate = date - threshold;
        const maxDate = date + threshold;
        
        expect(minDate < now).toBe(true);
        expect(maxDate > now).toBe(true);
      });

    it('should generate ids that have an incrementer as their second parameter',
      () => {
        const idParts1 = utils.uid().split('-');
        const firstInc = +idParts1[2];
        const idParts2 = utils.uid().split('-');
        const secondInc = +idParts2[2];

        expect(secondInc).toBe(firstInc + 1);
      });
    
    it('the incrementer should reset after a thousand runs', () => {
      const idParts1 = utils.uid().split('-');
      const firstInc = +idParts1[2];
      
      for (let i = 0; i < 1000; i += 1) {
        utils.uid();
      }
      
      const idParts2 = utils.uid().split('-');
      const secondInc = +idParts2[2];

      expect(secondInc).toBe(firstInc);
      
    });
  });
});
