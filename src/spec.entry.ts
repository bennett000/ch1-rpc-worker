import 'ts-helpers';

let testContext = (<{ context?: Function }>require).context(
  './',
  true,
  /^(?!\.\/index|\.\/spec).*\.ts$/);
testContext.keys().forEach(testContext);
