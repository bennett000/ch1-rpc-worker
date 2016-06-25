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
  
  describe('noop function', () => {
    it('there should be a noop function', () => {
      expect(() => utils.noop()).not.toThrow();
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
  });
  
});
