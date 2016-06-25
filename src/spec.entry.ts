import 'ts-helpers';

let testContext = (<{ context?: Function }>require).context(
  './',
  true,
  /.ts/);
testContext.keys().forEach(testContext);
